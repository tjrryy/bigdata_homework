/**
 * 多跳问答知识库可视化应用 (支持本地API模式)
 * 
 * 配置:
 * - API_MODE: true 使用Flask API, false 使用静态JSON文件
 * - API_BASE: API服务器地址
 */

const CONFIG = {
    API_MODE: false,  // 设为true使用API模式
    API_BASE: 'http://localhost:5000'
};

const state = { data: [], filteredData: [], currentDataset: 'train' };

document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    initDatasetSelector();
    initModeIndicator();
    await loadData('train');
    renderResults();
    renderStats();
    renderCluster();
});

function initModeIndicator() {
    const badge = document.getElementById('mode-indicator');
    const hint = document.getElementById('mode-hint');
    
    if (CONFIG.API_MODE) {
        badge.textContent = 'API模式';
        badge.classList.add('api-mode');
        hint.textContent = `连接中: ${CONFIG.API_BASE} | 静态模式: 设置 API_MODE=false`;
    } else {
        badge.textContent = '静态模式';
        hint.textContent = '当前使用静态JSON文件 | API模式: 编辑 js/app.js 设置 API_MODE=true';
    }
}

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + '-panel').classList.add('active');
            
            if (btn.dataset.tab === 'stats') renderStats();
            if (btn.dataset.tab === 'cluster') renderCluster();
        });
    });
}

function initDatasetSelector() {
    document.getElementById('dataset-select').addEventListener('change', async (e) => {
        await loadData(e.target.value);
        renderResults();
        renderStats();
        renderCluster();
    });
    
    document.getElementById('cluster-type').addEventListener('change', renderCluster);
}

async function loadData(dataset) {
    try {
        if (CONFIG.API_MODE) {
            const res = await fetch(`${CONFIG.API_BASE}/api/${dataset}`);
            state.data = await res.json();
        } else {
            const res = await fetch(`data/${dataset}_samples.json`);
            state.data = await res.json();
        }
        state.filteredData = state.data;
        state.currentDataset = dataset;
        console.log(`加载了 ${dataset} 数据集, ${state.data.length} 条数据`);
    } catch (e) {
        console.error('加载失败:', e);
        document.getElementById('results').innerHTML = `
            <div class="result-item" style="text-align:center;color:#f56c6c;">
                加载失败: ${e.message}<br>
                <small>提示: 如果使用API模式，请确保后端服务器已启动</small>
            </div>
        `;
    }
}

function initSearch() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');
    
    btn.addEventListener('click', doSearch);
    input.addEventListener('keypress', e => e.key === 'Enter' && doSearch());
}

async function doSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();
    
    if (!query) {
        state.filteredData = state.data;
        renderResults();
        return;
    }
    
    if (CONFIG.API_MODE) {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/api/${state.currentDataset}/search?q=${encodeURIComponent(query)}`);
            state.filteredData = await res.json();
            renderResults();
        } catch (e) {
            console.error('搜索失败:', e);
        }
    } else {
        state.filteredData = state.data.filter(item => 
            item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query)
        );
        renderResults();
    }
}

function renderResults() {
    const container = document.getElementById('results');
    const count = document.getElementById('result-count');
    count.textContent = '找到 ' + state.filteredData.length + ' 条结果';
    
    if (state.filteredData.length === 0) {
        container.innerHTML = '<div class="result-item" style="text-align:center;color:#888;">暂无结果</div>';
        return;
    }
    
    container.innerHTML = state.filteredData.slice(0, 50).map(item => `
        <div class="result-item">
            <span class="result-type ${item.type}">${getTypeLabel(item.type)}</span>
            <p class="result-question">${escape(item.question)}</p>
            <p class="result-answer">答案: <span>${escape(item.answer)}</span></p>
        </div>
    `).join('');
}

function renderStats() {
    const types = {};
    state.data.forEach(item => types[item.type] = (types[item.type] || 0) + 1);
    const total = state.data.length;
    
    document.getElementById('stat-total').textContent = total;
    
    const map = { compositional: 'compositional', comparison: 'comparison', bridge_comparison: 'bridge', inference: 'inference' };
    Object.entries(map).forEach(([type, id]) => {
        const el = document.getElementById('stat-' + id);
        const pct = document.getElementById('stat-' + id + '-pct');
        if (el) el.textContent = types[type] || 0;
        if (pct) pct.textContent = ((types[type] / total * 100) || 0).toFixed(1) + '%';
    });
    
    renderPieChart(types);
}

function renderPieChart(types) {
    const container = document.getElementById('type-chart');
    container.innerHTML = '';
    
    const width = 300, height = 300, radius = 120;
    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height)
        .append('g').attr('transform', `translate(${width/2},${height/2})`);
    
    const data = Object.entries(types);
    const colors = ['#4a90d9', '#67c23a', '#e6a23c', '#f56c6c'];
    
    svg.selectAll('path').data(d3.pie().value(d => d[1])(data)).enter()
        .append('path')
        .attr('d', d3.arc().innerRadius(0).outerRadius(radius))
        .attr('fill', (_, i) => colors[i % colors.length])
        .attr('stroke', '#1a1a1a')
        .attr('stroke-width', 2);
}

async function renderCluster() {
    const type = document.getElementById('cluster-type').value;
    const chartDiv = document.getElementById('cluster-chart');
    const detailsDiv = document.getElementById('cluster-details');
    
    let sorted;
    
    if (CONFIG.API_MODE) {
        try {
            const res = await fetch(`${CONFIG.API_BASE}/api/${state.currentDataset}/cluster?type=${type}`);
            sorted = await res.json();
            sorted = sorted.map(item => [item.name, Array(item.count).fill(item)]);
        } catch (e) {
            console.error('聚类数据获取失败:', e);
            return;
        }
    } else {
        let clusters = {};
        state.data.forEach(item => {
            let key;
            if (type === 'type') key = item.type;
            else if (type === 'question-start') {
                const words = ['Are', 'What', 'Which', 'Who', 'When', 'Where', 'How'];
                key = words.find(w => item.question.startsWith(w)) || item.question.split(' ')[0];
            } else {
                const a = item.answer.toLowerCase();
                key = (a === 'yes' || a === 'no') ? 'Yes/No' : (a.length < 20 ? '短文本' : '长文本');
            }
            clusters[key] = clusters[key] || [];
            clusters[key].push(item);
        });
        sorted = Object.entries(clusters).sort((a, b) => b[1].length - a[1].length).slice(0, 10);
    }
    
    // 柱状图
    chartDiv.innerHTML = '';
    const margin = { top: 20, right: 20, bottom: 80, left: 50 };
    const w = chartDiv.clientWidth - margin.left - margin.right;
    const h = 250 - margin.top - margin.bottom;
    
    const svg = d3.select(chartDiv).append('svg')
        .attr('width', w + margin.left + margin.right).attr('height', h + margin.top + margin.bottom)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().domain(sorted.map(d => d[0])).range([0, w]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(sorted, d => d[1].length)]).nice().range([h, 0]);
    
    svg.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x))
        .selectAll('text').attr('transform', 'rotate(-45)').style('text-anchor', 'end').style('fill', '#888');
    svg.append('g').call(d3.axisLeft(y)).selectAll('text').style('fill', '#888');
    
    svg.selectAll('rect').data(sorted).enter().append('rect')
        .attr('x', d => x(d[0])).attr('y', d => y(d[1].length))
        .attr('width', x.bandwidth()).attr('height', d => h - y(d[1].length))
        .attr('fill', (_, i) => ['#4a90d9', '#67c23a', '#e6a23c', '#f56c6c'][i % 4]);
    
    svg.selectAll('.label').data(sorted).enter().append('text')
        .attr('x', d => x(d[0]) + x.bandwidth() / 2).attr('y', d => y(d[1].length) - 5)
        .attr('text-anchor', 'middle').text(d => d[1].length).style('fill', '#888').style('font-size', '12px');
    
    // 卡片
    detailsDiv.innerHTML = sorted.map(([name, items]) => `
        <div class="cluster-card">
            <h4>${escape(name)}</h4>
            <p class="count">${items.length}</p>
            <p class="examples">例: ${escape(items[0].question ? items[0].question.substring(0, 40) : items[0].example.substring(0, 40))}...</p>
        </div>
    `).join('');
}

function getTypeLabel(type) {
    return { compositional: '组合型', comparison: '比较型', bridge_comparison: '桥接比较型', inference: '推理型' }[type] || type;
}

function escape(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

initSearch();