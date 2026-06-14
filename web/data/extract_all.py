#!/usr/bin/env python3
"""提取所有数据集样本"""
import json
import random
import os

def extract_samples(input_file, output_file, sample_size=500):
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    samples_per_type = sample_size // 4
    samples = {'compositional': [], 'comparison': [], 'bridge_comparison': [], 'inference': []}
    
    for item in data:
        item_type = item.get('type')
        if item_type in samples and len(samples[item_type]) < samples_per_type:
            simplified = {
                '_id': item['_id'], 'type': item['type'], 'question': item['question'],
                'answer': item['answer'], 'supporting_facts': item.get('supporting_facts', []),
                'evidences': item.get('evidences', []), 'context': item.get('context', [])[:5]
            }
            samples[item_type].append(simplified)
    
    result = []
    for type_samples in samples.values():
        result.extend(type_samples)
    random.shuffle(result)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f'{output_file}: {len(result)}条')

if __name__ == '__main__':
    random.seed(42)
    base = '/Users/icec0re/Desktop/dadadazuoye'
    extract_samples(f'{base}/data/train.json', f'{base}/web/data/samples.json', 2000)
    extract_samples(f'{base}/data/dev.json', f'{base}/web/data/dev_samples.json', 500)
    extract_samples(f'{base}/data/test.json', f'{base}/web/data/test_samples.json', 500)