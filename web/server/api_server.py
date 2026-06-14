#!/usr/bin/env python3
"""
Flask API服务器 - 通过Redis提供数据
使用方法: python api_server.py [--redis-url redis://localhost:6379] [--port 5000]
"""
import argparse
import json
from flask import Flask, jsonify, request
import redis

app = Flask(__name__)

def get_redis(redis_url):
    return redis.from_url(redis_url)

@app.route('/api/datasets')
def get_datasets():
    """获取所有可用数据集"""
    r = get_redis(app.config['REDIS_URL'])
    datasets = []
    for name in ['train', 'dev', 'test']:
        data = r.get(f'qa:{name}')
        if data:
            count = len(json.loads(data))
            datasets.append({'name': name, 'count': count})
    return jsonify(datasets)

@app.route('/api/<dataset>')
def get_dataset(dataset):
    """获取指定数据集"""
    r = get_redis(app.config['REDIS_URL'])
    data = r.get(f'qa:{dataset}')
    if not data:
        return jsonify({'error': 'Dataset not found'}), 404
    return jsonify(json.loads(data))

@app.route('/api/<dataset>/search')
def search_dataset(dataset):
    """搜索数据集"""
    r = get_redis(app.config['REDIS_URL'])
    query = request.args.get('q', '').lower()
    data = json.loads(r.get(f'qa:{dataset}') or '[]')
    
    if not query:
        return jsonify(data[:50])
    
    # 关键词搜索
    results = [
        item for item in data
        if query in item['question'].lower() or query in item['answer'].lower()
    ]
    return jsonify(results[:50])

@app.route('/api/<dataset>/stats')
def get_stats(dataset):
    """获取数据集统计"""
    r = get_redis(app.config['REDIS_URL'])
    data = json.loads(r.get(f'qa:{dataset}') or '[]')
    
    types = {}
    for item in data:
        types[item['type']] = types.get(item['type'], 0) + 1
    
    return jsonify({'total': len(data), 'types': types})

@app.route('/api/<dataset>/cluster')
def get_cluster(dataset):
    """获取聚类数据"""
    r = get_redis(app.config['REDIS_URL'])
    cluster_type = request.args.get('type', 'type')
    data = json.loads(r.get(f'qa:{dataset}') or '[]')
    
    clusters = {}
    for item in data:
        if cluster_type == 'type':
            key = item['type']
        elif cluster_type == 'question-start':
            words = ['Are', 'What', 'Which', 'Who', 'When', 'Where', 'How']
            key = next((w for w in words if item['question'].startswith(w)), item['question'].split()[0])
        else:  # answer-type
            a = item['answer'].lower()
            key = 'Yes/No' if a in ('yes', 'no') else ('短文本' if len(a) < 20 else '长文本')
        
        if key not in clusters:
            clusters[key] = []
        clusters[key].append(item)
    
    return jsonify([
        {'name': k, 'count': len(v), 'example': v[0]['question'][:50]}
        for k, v in sorted(clusters.items(), key=lambda x: -len(x[1]))[:10]
    ])

@app.route('/health')
def health():
    """健康检查"""
    try:
        r = get_redis(app.config['REDIS_URL'])
        r.ping()
        return jsonify({'status': 'ok'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--redis-url', default='redis://localhost:6379', help='Redis URL')
    parser.add_argument('--port', type=int, default=5000, help='端口')
    parser.add_argument('--debug', action='store_true', help='调试模式')
    args = parser.parse_args()
    
    app.config['REDIS_URL'] = args.redis_url
    print(f"启动API服务器: http://localhost:{args.port}")
    print(f"Redis: {args.redis_url}")
    app.run(host='0.0.0.0', port=args.port, debug=args.debug)