"""Load local discovery catalogs and rank English or Chinese search terms."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

RISK_ORDER = {'low': 0, 'guarded': 1, 'restricted': 2}
CHINESE_EXPANSIONS = {
    '域名': 'domain dns whois rdap certificate ip infrastructure',
    '网站': 'website domain web archive search', '证书': 'certificate ssl tls transparency',
    '历史': 'history archive wayback historical', '用户名': 'username nickname handle social account',
    '账号': 'account username social profile', '社交': 'social media network profile',
    '人物': 'people public records biography', '邮箱': 'email mail breach validation',
    '邮件': 'email mail', '电话': 'phone number', '手机': 'phone mobile number',
    '公司': 'company business registry corporate', '企业': 'company business registry corporate',
    '图片': 'image reverse image metadata exif', '照片': 'image photo reverse metadata exif',
    '视频': 'video keyframe verification', '地理': 'geospatial map geolocation location',
    '定位': 'geolocation location map', '地图': 'map geospatial satellite',
    '新闻': 'news media', '核查': 'fact checking verification', '事实': 'fact checking verification',
    '威胁': 'threat intelligence cti ioc', '漏洞': 'cve vulnerability threat',
    '恶意软件': 'malware threat intelligence', '文档': 'document pdf slides',
    '监控': 'monitoring alerts rss change detection', '代码': 'code search repository github',
}


def validate_tool(tool: dict, index: int) -> dict:
    label = f'catalog tool {index}'
    if not isinstance(tool, dict):
        raise ValueError(f'{label} must be an object')
    for field in ('id', 'name', 'url', 'category', 'risk_tier'):
        if not isinstance(tool.get(field), str) or not tool[field].strip():
            raise ValueError(f'{label}.{field} must be a nonempty string')
    for field in ('description', 'subcategory'):
        if not isinstance(tool.get(field, ''), str):
            raise ValueError(f'{label}.{field} must be a string')
    tags = tool.get('tags', [])
    if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
        raise ValueError(f'{label}.tags must be a list of strings')
    if tool['risk_tier'] not in RISK_ORDER:
        raise ValueError(f'{label}.risk_tier must be low, guarded, or restricted')
    url = tool['url']
    parsed = urlparse(url)
    if (parsed.scheme not in {'http', 'https'} or not parsed.hostname or parsed.username
            or parsed.password or any(char.isspace() or ord(char) < 32 for char in url)):
        raise ValueError(f'{label}.url must be an HTTP(S) URL without credentials or whitespace')
    return {**tool, 'domain': parsed.hostname.removeprefix('www.'), 'tags': tags,
            'description': tool.get('description', ''), 'subcategory': tool.get('subcategory', '')}


def load_catalog(path: str | Path) -> dict:
    """Accept the bundled subset or a compatible full Hunter catalog; never fetch it."""
    try:
        catalog = json.loads(Path(path).read_text(encoding='utf-8-sig'))
        if not isinstance(catalog, dict) or not isinstance(catalog.get('tools'), list) or not catalog['tools']:
            raise ValueError('catalog must contain a nonempty tools list')
        tools = [validate_tool(tool, index) for index, tool in enumerate(catalog['tools'], 1)]
        if len({tool['id'] for tool in tools}) != len(tools):
            raise ValueError('catalog contains duplicate tool IDs')
        return {**catalog, 'tools': tools}
    except (OSError, ValueError) as exc:
        raise ValueError(f'Cannot load catalog {path}: {exc}') from exc


def normalize(text: str) -> str:
    text = unicodedata.normalize('NFKD', text.casefold())
    text = ''.join(char for char in text if not unicodedata.combining(char))
    return re.sub(r'[^a-z0-9\u4e00-\u9fff]+', ' ', text).strip()


def score_tool(tool: dict, query: str) -> float:
    expanded = query + ' ' + ' '.join(value for key, value in CHINESE_EXPANSIONS.items() if key in query)
    tokens = [token for token in normalize(expanded).split() if len(token) > 1]
    if not tokens:
        return 0.0
    fields = {
        'name': normalize(tool.get('name', '')),
        'category': normalize(tool.get('category', '') + ' ' + tool.get('subcategory', '')),
        'description': normalize(tool.get('description', '')),
        'tags': normalize(' '.join(tool.get('tags', []))),
        'domain': normalize(tool.get('domain', '')),
    }
    weights = {'name': 8, 'category': 6, 'description': 3, 'tags': 4, 'domain': 2}
    score = 0.0
    for token in tokens:
        for field, text in fields.items():
            if token in text:
                score += weights[field] + (0.5 if text.startswith(token) else 0)
    phrase = normalize(query)
    if phrase and phrase in fields['name']:
        score += 12
    if phrase and phrase in fields['description']:
        score += 5
    if score > 0 and tool.get('risk_tier') == 'low':
        score += 0.4
    return score
