'use strict';

const API_VERSION = '2022-11-28';
const DEFAULT_ATTEMPTS = 20;
const DEFAULT_DELAY_MS = 30_000;

function requiredEnvironment(env = process.env) {
  const values = {
    repository: env.GITHUB_REPOSITORY,
    releaseSha: env.RELEASE_SHA,
    releaseTag: env.RELEASE_TAG,
    token: env.GITHUB_TOKEN,
  };
  for (const [name, value] of Object.entries(values)) {
    if (!value) throw new Error(`Missing required release gate input: ${name}`);
  }
  if (!/^[0-9a-f]{40}$/.test(values.releaseSha)) {
    throw new Error('RELEASE_SHA must be a full lowercase commit SHA');
  }
  if (!/^v[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/.test(values.releaseTag)) {
    throw new Error('RELEASE_TAG is not a supported version tag');
  }
  return values;
}

async function githubApi(path, { repository, token }, fetchImpl = fetch) {
  const response = await fetchImpl(`https://api.github.com/repos/${repository}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': API_VERSION,
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed with status ${response.status}`);
  }
  return response.json();
}

async function verifySignedAnnotatedTag(inputs, fetchImpl = fetch) {
  const reference = await githubApi(
    `/git/ref/tags/${encodeURIComponent(inputs.releaseTag)}`,
    inputs,
    fetchImpl
  );
  if (reference.object.type !== 'tag') {
    throw new Error('Release tag must be annotated; lightweight tags are rejected');
  }
  const tagObject = await githubApi(`/git/tags/${reference.object.sha}`, inputs, fetchImpl);
  if (tagObject.verification.verified !== true) {
    const reason = tagObject.verification.reason || 'unknown';
    throw new Error(`Release tag signature is not verified: ${reason}`);
  }
  if (tagObject.object.type !== 'commit' || tagObject.object.sha !== inputs.releaseSha) {
    throw new Error('Verified release tag does not point at the checked-out commit');
  }
}

function assessExactShaGates(runs, checks, releaseSha) {
  const latestCi = runs
    .filter(run => run.head_sha === releaseSha && run.name === 'CI')
    .sort((left, right) => Number(right.id || 0) - Number(left.id || 0))[0];
  const latestCodeql = latestByName(
    checks.filter(check => check.head_sha === releaseSha && /codeql/i.test(check.name || ''))
  );
  if (latestCi?.status === 'completed' && latestCi.conclusion !== 'success') {
    return { state: 'failed', reason: `CI concluded ${latestCi.conclusion}` };
  }
  const failedCodeql = latestCodeql.find(
    check => check.status === 'completed' && check.conclusion !== 'success'
  );
  if (failedCodeql) {
    return { state: 'failed', reason: `${failedCodeql.name} concluded ${failedCodeql.conclusion}` };
  }
  const ciPassed = latestCi?.status === 'completed' && latestCi.conclusion === 'success';
  const codeqlPassed =
    latestCodeql.length > 0 &&
    latestCodeql.every(
      check => check.status === 'completed' && check.conclusion === 'success'
    );
  return ciPassed && codeqlPassed
    ? { state: 'passed' }
    : { state: 'pending', reason: 'waiting for successful CI and CodeQL on the release SHA' };
}

function latestByName(checks) {
  const latest = new Map();
  for (const check of checks) {
    const prior = latest.get(check.name);
    if (!prior || Number(check.id || 0) > Number(prior.id || 0)) latest.set(check.name, check);
  }
  return [...latest.values()];
}

async function waitForExactShaGates(inputs, fetchImpl = fetch, sleep = defaultSleep) {
  const attempts = positiveInteger(process.env.RELEASE_GATE_ATTEMPTS, DEFAULT_ATTEMPTS);
  const delayMs = positiveInteger(process.env.RELEASE_GATE_DELAY_MS, DEFAULT_DELAY_MS);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const [workflowPayload, checkPayload] = await Promise.all([
      githubApi(
        `/actions/runs?head_sha=${inputs.releaseSha}&event=push&per_page=100`,
        inputs,
        fetchImpl
      ),
      githubApi(`/commits/${inputs.releaseSha}/check-runs?per_page=100`, inputs, fetchImpl),
    ]);
    const assessment = assessExactShaGates(
      workflowPayload.workflow_runs || [],
      checkPayload.check_runs || [],
      inputs.releaseSha
    );
    if (assessment.state === 'passed') return;
    if (assessment.state === 'failed') throw new Error(assessment.reason);
    if (attempt < attempts) await sleep(delayMs);
  }
  throw new Error('Timed out waiting for successful exact-SHA CI and CodeQL checks');
}

function positiveInteger(value, fallback) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error('Release gate retry settings must be positive integers');
  }
  return parsed;
}

function defaultSleep(delayMs) {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

async function main() {
  const inputs = requiredEnvironment();
  await verifySignedAnnotatedTag(inputs);
  await waitForExactShaGates(inputs);
  console.log('Verified signed annotated tag and successful exact-SHA CI/CodeQL gates.');
}

if (require.main === module) {
  main().catch(error => {
    console.error(`Release gate verification failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  assessExactShaGates,
  requiredEnvironment,
  verifySignedAnnotatedTag,
  waitForExactShaGates,
};
