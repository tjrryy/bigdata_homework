#!/usr/bin/env python3
"""
数据预处理脚本
从train.json提取样本数据用于前端可视化
"""
import json
import random
import os

def extract_samples(input_file, output_file, sample_size=2000):
    """提取样本数据"""
    print(f"读取文件: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"总数据量: {len(data)}")
    
    # 每种类型采样
    samples_per_type = sample_size // 4
    samples = {
        'compositional': [],
        'comparison': [],
        'bridge_comparison': [],
        'inference': []
    }
    
    for item in data:
        item_type = item.get('type')
        if item_type in samples and len(samples[item_type]) < samples_per_type:
            # 简化数据，减少体积
            simplified = {
                '_id': item['_id'],
                'type': item['type'],
                'question': item['question'],
                'answer': item['answer'],
                'supporting_facts': item.get('supporting_facts', []),
                'evidences': item.get('evidences', []),
                'context': item.get('context', [])[:5]  # 只保留前5个context
            }
            samples[item_type].append(simplified)
    
    # 合并并打乱
    result = []
    for type_samples in samples.values():
        result.extend(type_samples)
    
    random.shuffle(result)
    print(f"提取样本数: {len(result)}")
    
    # 保存
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"已保存到: {output_file}")
    
    # 生成统计信息
    stats = {
        'total': len(data),
        'types': {k: len(v) for k, v in samples.items()},
        'sampleSize': len(result)
    }
    
    stats_file = os.path.join(os.path.dirname(output_file), 'stats.json')
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print(f"统计信息已保存到: {stats_file}")
    
    return result

if __name__ == '__main__':
    input_path = '/Users/icec0re/Desktop/dadadazuoye/data/train.json'
    output_path = '/Users/icec0re/Desktop/dadadazuoye/web/data/samples.json'
    
    random.seed(42)
    extract_samples(input_path, output_path, sample_size=2000)