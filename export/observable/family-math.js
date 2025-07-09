// FAMILY MATH VISUALIZATIONS FOR OBSERVABLE
// Copy each cell block below into Observable notebook cells

// ============================================================================
// CELL 1: Title & Description (Markdown)
// ============================================================================
/*
# Family Math: Growth Patterns in Everyday Life

Interactive visualizations demonstrating how different mathematical growth patterns affect family scenarios. Watch how costs, relationships, decisions, and arrangements scale as family size increases.

**Four Growth Patterns:**
- **Linear Growth**: Airline ticket costs (f(n) = n × $250)
- **Quadratic Growth**: Family relationships (f(n) = n(n-1)/2)
- **Exponential Growth**: Decision scenarios (f(n) = 2^n)
- **Factorial Growth**: Line arrangements (f(n) = n!)

Use the slider to explore how each pattern scales differently with family size.
*/

// ============================================================================
// CELL 2: Consolidated CSS Styles
// ============================================================================
html`<style>
/* Base styles */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: #f8fafc;
}

/* Responsive media queries */
@media (max-width: 768px) {
    body {
        padding: 10px;
        max-width: 100%;
    }
    
    .widget-container {
        padding: 20px;
        margin-bottom: 15px;
    }
    
    .slider-container {
        flex-direction: column;
        gap: 15px;
        margin-bottom: 30px;
    }
    
    #familySlider {
        width: 250px;
    }
    
    .section-title {
        font-size: 18px;
    }
    
    h1 {
        font-size: 24px !important;
    }
}

/* Widget container styles */
.widget-container {
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    text-align: center;
}

/* Slider styles */
.slider-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 40px;
}

.slider-label {
    font-weight: 600;
    color: #374151;
    font-size: 16px;
}

#familySlider {
    width: 300px;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    outline: none;
    cursor: pointer;
}

#familySlider::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

#familySlider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.family-size {
    font-size: 24px;
    font-weight: bold;
    color: #3b82f6;
    min-width: 40px;
    text-align: center;
}

.section-title {
    font-size: 20px;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 20px;
    text-align: center;
}

/* SVG and visualization styles */
svg {
    display: block;
    margin: 0 auto;
    max-width: 100%;
    height: auto;
}

.cost-display {
    text-align: center;
    margin-top: 0;
}

.cost-amount {
    font-size: 28px;
    font-weight: bold;
    color: #10b981;
}

.scenario-display {
    text-align: center;
    margin-top: 0;
}

.scenario-count {
    font-size: 28px;
    font-weight: bold;
    color: #10b981;
    margin-bottom: 10px;
}

.relationship-display {
    text-align: center;
    margin-top: 0;
}

.relationship-count {
    font-size: 28px;
    font-weight: bold;
    color: #10b981;
}

.arrangement-display {
    text-align: center;
    margin-top: 0;
}

.arrangement-count {
    font-size: 28px;
    font-weight: bold;
    color: #10b981;
    margin-bottom: 10px;
}

.formula-text {
    font-size: 16px;
    color: #6b7280;
    margin: 5px 0;
}

/* Exponential visualization styles */
.decision-box {
    stroke: #374151;
    stroke-width: 1;
    cursor: pointer;
    transition: fill 0.3s ease;
}

.decision-box.agree {
    fill: #10b981;
}

.decision-box.disagree {
    fill: #ef4444;
}

.decision-text {
    font-size: 10px;
    text-anchor: middle;
    dominant-baseline: middle;
    fill: white;
    font-weight: bold;
    pointer-events: none;
}

.family-member-label {
    font-size: 12px;
    text-anchor: middle;
    fill: #374151;
    font-weight: 600;
}

/* Quadratic visualization styles */
.connection-line {
    stroke: #10b981;
    stroke-width: 2;
    opacity: 0.7;
}

.family-member {
    cursor: pointer;
}

.member-face {
    font-size: 24px;
    text-anchor: middle;
    dominant-baseline: middle;
}

.relationship-symbol {
    font-size: 14px;
    text-anchor: middle;
    dominant-baseline: middle;
}

.positive-relationship {
    fill: #ef4444;
}

.negative-relationship {
    fill: #f59e0b;
}

/* Factorial visualization styles */
.person-avatar {
    cursor: pointer;
}

.person-circle {
    fill: #3b82f6;
    stroke: #1d4ed8;
    stroke-width: 2;
}

.person-label {
    font-size: 12px;
    text-anchor: middle;
    dominant-baseline: middle;
    fill: white;
    font-weight: bold;
}

.line-arrangement {
    opacity: 0.8;
}

.line-arrangement:hover {
    opacity: 1;
}

.arrangement-line {
    stroke: #d1d5db;
    stroke-width: 2;
    opacity: 0.6;
}
</style>`

// ============================================================================
// CELL 3: Family Size Slider (Shared Control)
// ============================================================================
viewof familySize = Inputs.range([2, 8], {
  value: 4,
  step: 1,
  label: "Family Size"
})

// ============================================================================
// CELL 4: Linear Growth - Airline Costs
// ============================================================================
linearChart = {
  const width = 400;
  const cost = familySize * 250;
  const height = 50 + (familySize * 50) + 60;
  
  const EMOJI_MAP = {
    1: "😊", 2: "😄", 3: "😐", 4: "😰",
    5: "😟", 6: "😢", 7: "😭", 8: "🫠"
  };
  
  const CONFIG = {
    ticket: {
      width: 100,
      height: 40,
      spacing: 50,
      startX: 150,
      startY: 50
    }
  };
  
  function createTicketStructure(selection) {
    selection.append("rect")
      .attr("class", "ticket-body")
      .attr("width", CONFIG.ticket.width)
      .attr("height", CONFIG.ticket.height)
      .attr("rx", 8)
      .style("fill", "white")
      .style("stroke", "#e5e7eb")
      .style("stroke-width", "2");
    
    selection.selectAll(".perforation")
      .data(d3.range(6))
      .join("rect")
      .attr("class", "perforation")
      .attr("x", 12)
      .attr("y", (d, i) => 7 + i * 4.5)
      .attr("width", 2)
      .attr("height", 2)
      .attr("rx", 1)
      .style("fill", "#9ca3af");
    
    selection.selectAll(".dash")
      .data(d3.range(8))
      .join("rect")
      .attr("class", "dash")
      .attr("x", 24)
      .attr("y", (d, i) => 5 + i * 4)
      .attr("width", 1)
      .attr("height", 2)
      .style("fill", "#d1d5db");
    
    const planeGroup = selection.append("g")
      .attr("transform", "translate(75, 12)");
    
    planeGroup.append("path")
      .attr("d", "M2 12L1 3L20 12L1 21L2 12ZM2 12L9 12")
      .style("fill", "none")
      .style("stroke", "#374151")
      .style("stroke-width", "2")
      .style("stroke-linecap", "round")
      .style("stroke-linejoin", "round")
      .attr("transform", "scale(0.7)");
    
    const textLines = [
      {x: 30, y: 10, width: 20},
      {x: 30, y: 14, width: 15},
      {x: 30, y: 18, width: 25},
      {x: 30, y: 22, width: 18}
    ];
    
    selection.selectAll(".text-line")
      .data(textLines)
      .join("rect")
      .attr("class", "text-line")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("width", d => d.width)
      .attr("height", 1.5)
      .style("fill", "#d1d5db");
  }
  
  // Use html template for better Observable integration
  const container = html`<div style="text-align: center;">
    <h3 style="color: #1f2937; margin-bottom: 20px;">Linear Growth: Airline Costs</h3>
    <div class="viz-container"></div>
    <div style="margin-top: 20px; font-size: 28px; font-weight: bold; color: #10b981;">
      $${cost.toLocaleString()} ${EMOJI_MAP[familySize] || "💀"}
    </div>
  </div>`;
  
  // Create SVG using D3 on the container
  const svg = d3.select(container.querySelector('.viz-container'))
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  
  // Create ticket data and bind to DOM
  const ticketData = d3.range(familySize);
  const tickets = svg.selectAll(".ticket-group")
    .data(ticketData)
    .join("g")
    .attr("class", "ticket-group")
    .attr("transform", (d, i) => 
      `translate(${CONFIG.ticket.startX}, ${CONFIG.ticket.startY + i * CONFIG.ticket.spacing})`);
  
  // Apply ticket structure
  createTicketStructure(tickets);
  
  // Return the container node
  return container;
}

// ============================================================================
// CELL 5: Quadratic Growth - Family Relationships
// ============================================================================
quadraticChart = {
  const width = 350;
  const height = 125 + 80 + 30;
  const relationshipCount = familySize * (familySize - 1) / 2;
  
  const CONFIG = {
    member: {
      radius: 20,
      centerX: 175,
      centerY: 125,
      circleRadius: 80
    },
    transitions: {
      duration: 500,
      textDuration: 400
    }
  };
  
  const FACE_EMOJIS = {
    happy: ["😊", "😄", "😃", "😁", "🙂", "😌"],
    neutral: ["😐", "😑", "🙄", "😒"],
    sad: ["😔", "😞", "😟", "😕", "😢"]
  };
  
  const RELATIONSHIP_SYMBOLS = {
    positive: ["♥", "💕", "💖", "💗"],
    negative: ["💥", "⚡", "💢", "🔥"]
  };
  
  function getRandomEmoji(category) {
    const emojis = FACE_EMOJIS[category];
    return emojis[Math.floor(Math.random() * emojis.length)];
  }
  
  function getRandomRelationshipSymbol() {
    const isPositive = Math.random() > 0.3;
    const category = isPositive ? 'positive' : 'negative';
    const symbols = RELATIONSHIP_SYMBOLS[category];
    return {
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      type: category
    };
  }
  
  function assignEmotions(count) {
    const emotions = [];
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let emotion;
      if (rand < 0.5) emotion = 'happy';
      else if (rand < 0.8) emotion = 'neutral';
      else emotion = 'sad';
      emotions.push({
        emotion: emotion,
        emoji: getRandomEmoji(emotion)
      });
    }
    return emotions;
  }
  
  function calculateMemberPositions(n) {
    if (n === 1) {
      return [{x: CONFIG.member.centerX, y: CONFIG.member.centerY}];
    }
    
    const positions = [];
    const angleStep = (2 * Math.PI) / n;
    
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = CONFIG.member.centerX + CONFIG.member.circleRadius * Math.cos(angle);
      const y = CONFIG.member.centerY + CONFIG.member.circleRadius * Math.sin(angle);
      positions.push({x, y});
    }
    
    return positions;
  }
  
  function generateConnections(positions) {
    const connections = [];
    
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const midX = (positions[i].x + positions[j].x) / 2;
        const midY = (positions[i].y + positions[j].y) / 2;
        const relationship = getRandomRelationshipSymbol();
        
        connections.push({
          source: positions[i],
          target: positions[j],
          midX,
          midY,
          symbol: relationship.symbol,
          type: relationship.type
        });
      }
    }
    
    return connections;
  }
  
  const container = html`<div style="text-align: center;">
    <h3 style="color: #1f2937; margin-bottom: 20px;">Quadratic Growth: Family Relationships</h3>
    <div class="viz-container"></div>
    <div style="margin-top: 20px; font-size: 28px; font-weight: bold; color: #10b981;">
      ${relationshipCount} relationship${relationshipCount !== 1 ? 's' : ''}
    </div>
  </div>`;
  
  const svg = d3.select(container.querySelector('.viz-container'))
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  
  const defs = svg.append("defs");
  const filter = defs.append("filter")
    .attr("id", "dropshadow-quad")
    .attr("x", "-20%")
    .attr("y", "-20%")
    .attr("width", "140%")
    .attr("height", "140%");
  
  filter.append("feDropShadow")
    .attr("dx", "1")
    .attr("dy", "2")
    .attr("stdDeviation", "2")
    .attr("flood-color", "rgba(0,0,0,0.1)");
  
  const connectionsLayer = svg.append("g").attr("class", "connections-layer");
  const symbolsLayer = svg.append("g").attr("class", "symbols-layer");
  const membersLayer = svg.append("g").attr("class", "members-layer");
  
  const positions = calculateMemberPositions(familySize);
  const memberEmotions = assignEmotions(familySize);
  const connections = generateConnections(positions);
  
  positions.forEach((pos, i) => {
    pos.emotion = memberEmotions[i];
  });
  
  const connectionLines = connectionsLayer.selectAll(".connection-line")
    .data(connections)
    .enter()
    .append("line")
    .attr("class", "connection-line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .style("stroke", "#10b981")
    .style("stroke-width", "2")
    .style("opacity", "0.7");
  
  const relationshipSymbols = symbolsLayer.selectAll(".relationship-symbol")
    .data(connections)
    .enter()
    .append("text")
    .attr("class", d => `relationship-symbol ${d.type}-relationship`)
    .attr("x", d => d.midX)
    .attr("y", d => d.midY)
    .style("font-size", "14px")
    .style("text-anchor", "middle")
    .style("dominant-baseline", "middle")
    .style("fill", d => d.type === "positive" ? "#ef4444" : "#f59e0b")
    .text(d => d.symbol);
  
  const members = membersLayer.selectAll(".family-member")
    .data(positions)
    .enter()
    .append("g")
    .attr("class", "family-member")
    .attr("transform", d => `translate(${d.x}, ${d.y})`);
  
  members.append("text")
    .attr("class", "member-face")
    .style("font-size", "24px")
    .style("text-anchor", "middle")
    .style("dominant-baseline", "middle")
    .style("filter", "url(#dropshadow-quad)")
    .text(d => d.emotion.emoji);
  
  return container;
}

// ============================================================================
// CELL 6: Exponential Growth - Decision Scenarios
// ============================================================================
exponentialChart = {
  const width = 350;
  const totalScenarios = Math.pow(2, familySize);
  const displayRows = Math.min(totalScenarios, 10);
  const height = 50 + (displayRows * 25) + 30;
  
  const CONFIG = {
    box: {
      width: 30,
      height: 20,
      spacing: 4
    },
    layout: {
      startY: 50,
      rowSpacing: 25,
      maxDisplayRows: 10
    }
  };
  
  function getLayoutStartX(familySize) {
    const boxWidth = familySize * (30 + 4);
    return (350 / 2) - (boxWidth / 2);
  }
  
  function generateScenarios(n) {
    const scenarios = [];
    const totalScenarios = Math.pow(2, n);
    
    for (let i = 0; i < totalScenarios; i++) {
      const scenario = [];
      for (let j = 0; j < n; j++) {
        const bit = (i >> j) & 1;
        scenario.push(bit === 1);
      }
      scenarios.push(scenario);
    }
    
    for (let i = scenarios.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [scenarios[i], scenarios[j]] = [scenarios[j], scenarios[i]];
    }
    
    return scenarios;
  }
  
  function calculateBoxPositions(scenarios, familySize) {
    const positions = [];
    const displayRows = Math.min(scenarios.length, CONFIG.layout.maxDisplayRows);
    const layoutStartX = getLayoutStartX(familySize);
    
    scenarios.slice(0, displayRows).forEach((scenario, rowIndex) => {
      const rowPositions = [];
      scenario.forEach((decision, colIndex) => {
        const x = layoutStartX + colIndex * (CONFIG.box.width + CONFIG.box.spacing);
        const y = CONFIG.layout.startY + rowIndex * CONFIG.layout.rowSpacing;
        
        rowPositions.push({
          x: x,
          y: y,
          decision: decision,
          rowIndex: rowIndex,
          colIndex: colIndex
        });
      });
      positions.push(rowPositions);
    });
    
    return positions;
  }
  
  const container = html`<div style="text-align: center;">
    <h3 style="color: #1f2937; margin-bottom: 20px;">Exponential Growth: Decision Scenarios</h3>
    <div class="viz-container"></div>
    <div style="margin-top: 20px; font-size: 28px; font-weight: bold; color: #10b981;">
      ${totalScenarios} scenario${totalScenarios !== 1 ? 's' : ''}
    </div>
    <div style="font-size: 16px; color: #6b7280; margin: 5px 0;">
      2^${familySize} = ${totalScenarios}
    </div>
    <div style="font-size: 16px; color: #6b7280; margin: 5px 0;">
      Each person can agree or disagree
    </div>
  </div>`;
  
  const svg = d3.select(container.querySelector('.viz-container'))
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  
  const scenariosLayer = svg.append("g").attr("class", "scenarios-layer");
  const labelsLayer = svg.append("g").attr("class", "labels-layer");
  
  const scenarios = generateScenarios(familySize);
  const boxPositions = calculateBoxPositions(scenarios, familySize);
  const flatPositions = boxPositions.flat();
  
  const layoutStartX = getLayoutStartX(familySize);
  
  const numberLabels = labelsLayer.selectAll(".number-label")
    .data(d3.range(familySize))
    .enter()
    .append("text")
    .attr("class", "number-label")
    .attr("x", (d, i) => layoutStartX + i * (CONFIG.box.width + CONFIG.box.spacing) + CONFIG.box.width / 2)
    .attr("y", CONFIG.layout.startY - 10)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#374151")
    .style("font-weight", "600")
    .text((d, i) => `${i + 1}`);
  
  const decisionBoxes = scenariosLayer.selectAll(".decision-group")
    .data(flatPositions)
    .enter()
    .append("g")
    .attr("class", "decision-group")
    .attr("transform", d => `translate(${d.x}, ${d.y})`);
  
  decisionBoxes.append("rect")
    .attr("class", d => `decision-box ${d.decision ? 'agree' : 'disagree'}`)
    .attr("width", CONFIG.box.width)
    .attr("height", CONFIG.box.height)
    .attr("rx", 2)
    .style("fill", d => d.decision ? "#10b981" : "#ef4444")
    .style("stroke", "#374151")
    .style("stroke-width", "1");
  
  decisionBoxes.append("text")
    .attr("class", "decision-text")
    .attr("x", CONFIG.box.width / 2)
    .attr("y", CONFIG.box.height / 2)
    .style("font-size", "10px")
    .style("text-anchor", "middle")
    .style("dominant-baseline", "middle")
    .style("fill", "white")
    .style("font-weight", "bold")
    .text(d => d.decision ? "✓" : "✗");
  
  const hasMoreRows = scenarios.length > CONFIG.layout.maxDisplayRows;
  if (hasMoreRows) {
    svg.append("text")
      .attr("class", "more-indicator")
      .attr("x", layoutStartX + familySize * (CONFIG.box.width + CONFIG.box.spacing) / 2)
      .attr("y", CONFIG.layout.startY + CONFIG.layout.maxDisplayRows * CONFIG.layout.rowSpacing + 15)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#9ca3af")
      .style("font-style", "italic")
      .text(`...and ${scenarios.length - CONFIG.layout.maxDisplayRows} more scenarios`);
  }
  
  return container;
}

// ============================================================================
// CELL 7: Factorial Growth - Line Arrangements
// ============================================================================
factorialChart = {
  const width = 350;
  const totalArrangements = d3.range(1, familySize + 1).reduce((a, b) => a * b, 1);
  const displayRows = Math.min(totalArrangements, 10);
  const height = 50 + (displayRows * 35) + 40;
  
  const CONFIG = {
    person: {
      radius: 15,
      spacing: 45,
      lineSpacing: 35
    },
    layout: {
      startY: 50,
      maxDisplayRows: 10
    }
  };
  
  const PERSON_NAMES = ["1", "2", "3", "4", "5", "6", "7", "8"];
  const PERSON_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
  
  function getLayoutStartX(familySize) {
    const totalWidth = familySize * CONFIG.person.spacing;
    return (width / 2) - (totalWidth / 2);
  }
  
  function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }
  
  function generateArrangements(n) {
    const people = Array.from({length: n}, (_, i) => i);
    const arrangements = [];
    
    function permute(arr, start = 0) {
      if (start >= arr.length) {
        arrangements.push([...arr]);
        return;
      }
      
      for (let i = start; i < arr.length; i++) {
        [arr[start], arr[i]] = [arr[i], arr[start]];
        permute(arr, start + 1);
        [arr[start], arr[i]] = [arr[i], arr[start]];
      }
    }
    
    permute(people);
    
    for (let i = arrangements.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrangements[i], arrangements[j]] = [arrangements[j], arrangements[i]];
    }
    
    return arrangements;
  }
  
  function calculateArrangementPositions(arrangements, familySize) {
    const positions = [];
    const displayRows = Math.min(arrangements.length, CONFIG.layout.maxDisplayRows);
    const layoutStartX = getLayoutStartX(familySize);
    
    arrangements.slice(0, displayRows).forEach((arrangement, rowIndex) => {
      const rowPositions = [];
      arrangement.forEach((personIndex, colIndex) => {
        const x = layoutStartX + colIndex * CONFIG.person.spacing;
        const y = CONFIG.layout.startY + rowIndex * CONFIG.person.lineSpacing;
        
        rowPositions.push({
          x: x,
          y: y,
          personIndex: personIndex,
          rowIndex: rowIndex,
          colIndex: colIndex
        });
      });
      positions.push(rowPositions);
    });
    
    return positions;
  }
  
  const container = html`<div style="text-align: center;">
    <h3 style="color: #1f2937; margin-bottom: 20px;">Factorial Growth: Line Arrangements</h3>
    <div class="viz-container"></div>
    <div style="margin-top: 20px; font-size: 28px; font-weight: bold; color: #10b981;">
      ${totalArrangements} arrangement${totalArrangements !== 1 ? 's' : ''}
    </div>
    <div style="font-size: 16px; color: #6b7280; margin: 5px 0;">
      ${familySize}! = ${totalArrangements}
    </div>
    <div style="font-size: 16px; color: #6b7280; margin: 5px 0;">
      Each person can be in any position
    </div>
  </div>`;
  
  const svg = d3.select(container.querySelector('.viz-container'))
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  
  const linesLayer = svg.append("g").attr("class", "lines-layer");
  const arrangementsLayer = svg.append("g").attr("class", "arrangements-layer");
  
  const arrangements = generateArrangements(familySize);
  const arrangementPositions = calculateArrangementPositions(arrangements, familySize);
  const flatPositions = arrangementPositions.flat();
  
  const lineData = [];
  arrangementPositions.forEach(arrangement => {
    for (let i = 0; i < arrangement.length - 1; i++) {
      lineData.push({
        x1: arrangement[i].x,
        y1: arrangement[i].y,
        x2: arrangement[i + 1].x,
        y2: arrangement[i + 1].y,
        rowIndex: arrangement[i].rowIndex
      });
    }
  });
  
  const arrangementLines = linesLayer.selectAll(".arrangement-line")
    .data(lineData)
    .enter()
    .append("line")
    .attr("class", "arrangement-line")
    .attr("x1", d => d.x1)
    .attr("y1", d => d.y1)
    .attr("x2", d => d.x2)
    .attr("y2", d => d.y2)
    .style("stroke", "#d1d5db")
    .style("stroke-width", "2")
    .style("opacity", "0.6");
  
  const personAvatars = arrangementsLayer.selectAll(".person-avatar")
    .data(flatPositions)
    .enter()
    .append("g")
    .attr("class", "person-avatar")
    .attr("transform", d => `translate(${d.x}, ${d.y})`);
  
  personAvatars.append("circle")
    .attr("class", "person-circle")
    .attr("r", CONFIG.person.radius)
    .style("fill", d => PERSON_COLORS[d.personIndex % PERSON_COLORS.length])
    .style("stroke", d => d3.color(PERSON_COLORS[d.personIndex % PERSON_COLORS.length]).darker(0.5))
    .style("stroke-width", "2");
  
  personAvatars.append("text")
    .attr("class", "person-label")
    .attr("x", 0)
    .attr("y", 0)
    .style("font-size", "12px")
    .style("text-anchor", "middle")
    .style("dominant-baseline", "middle")
    .style("fill", "white")
    .style("font-weight", "bold")
    .text(d => PERSON_NAMES[d.personIndex]);
  
  const hasMoreArrangements = arrangements.length > CONFIG.layout.maxDisplayRows;
  if (hasMoreArrangements) {
    const layoutStartX = getLayoutStartX(familySize);
    svg.append("text")
      .attr("class", "more-indicator")
      .attr("x", layoutStartX + familySize * CONFIG.person.spacing / 2)
      .attr("y", CONFIG.layout.startY + CONFIG.layout.maxDisplayRows * CONFIG.person.lineSpacing + 20)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#9ca3af")
      .style("font-style", "italic")
      .text(`...and ${arrangements.length - CONFIG.layout.maxDisplayRows} more arrangements`);
  }
  
  return container;
}