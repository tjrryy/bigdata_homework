#!/usr/bin/env python3
"""
将数据导入Redis
使用方法: python import_to_redis.py [--redis-url redis://localhost:6379]
"""
import argparse
import json
import redis
from tqdm import tqdm

def import_to_redis(data_dir, redis_url='redis://localhost:6379'):
    r = redis.from_url(redis_url)
    
    print(f"连接到Redis: {redis_url}")
    
    # 清空旧数据
    print("清空旧数据...")
    r.delete('qa:train', 'qa:dev', 'qa:test', 'qa:index')
    
    for dataset in ['train', 'dev', 'test']:
        json_file = f"{data_dir}/{dataset}_samples.json"
        print(f"\n导入 {dataset} 数据集...")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 导入JSON数据
        r.set(f'qa:{dataset}', json.dumps(data, ensure_ascii=False))
        
        # 创建搜索索引 (关键词 -> ID列表)
        index_key = f'qa:{dataset}:index'
        for item in tqdm(data, desc=f"索引{dataset}"):
            # 提取关键词
            words = set(item['question'].lower().split() + item['answer'].lower().split())
            words = {w for w in words if len(w) > 3 and w.isalpha()}
            
            for word in words:
                r.sadd(f'word:{dataset}:{word}', item['_id'])
        
        print(f"  导入 {len(data)} 条记录")
    
    print("\n导入完成!")
    
    # 验证
    print("\n验证数据:")
    for dataset in ['train', 'dev', 'test']:
        count = len(json.loads(r.get(f'qa:{dataset}')))
        print(f"  {dataset}: {count} 条")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='导入数据到Redis')
    parser.add_argument('--data-dir', default='data', help='数据目录')
    parser.add_argument('--redis-url', default='redis://localhost:6379', help='Redis URL')
    args = parser.parse_args()
    
    import_to_redis(args.data_dir, args.redis_url)