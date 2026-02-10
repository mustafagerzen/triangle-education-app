document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('triangleCanvas');
    const ctx = canvas.getContext('2d');

    // UI Elements
    const inputs = {
        sideA: document.getElementById('sideA'),
        sideB: document.getElementById('sideB'),
        sideC: document.getElementById('sideC'),
        angleA: document.getElementById('angleA'),
        angleB: document.getElementById('angleB'),
        angleC: document.getElementById('angleC')
    };

    // State
    const state = {
        points: {
            A: { x: 300, y: 100 },
            B: { x: 150, y: 300 },
            C: { x: 450, y: 300 }
        },
        dragging: null,
        dragOffset: { x: 0, y: 0 }
    };

    const CONFIG = {
        vertexRadius: 8,
        vertexColor: '#58a6ff',
        vertexHoverColor: '#79c0ff',
        lineColor: '#f0f6fc',
        lineWidth: 2,
        fillColor: 'rgba(88, 166, 255, 0.1)',
        labelFont: '16px Outfit',
        labelColor: '#8b949e'
    };

    // Utility Functions
    function distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    function toDegrees(rad) {
        return rad * (180 / Math.PI);
    }

    function calculateGeometry() {
        const a = distance(state.points.B, state.points.C); // Side opposite to A
        const b = distance(state.points.A, state.points.C); // Side opposite to B
        const c = distance(state.points.A, state.points.B); // Side opposite to C

        // Law of Cosines for angles
        // c^2 = a^2 + b^2 - 2ab cos(C)
        // cos(C) = (a^2 + b^2 - c^2) / 2ab

        // Clamp values to -1 to 1 to avoid NaN from floating point errors
        const clamp = (val) => Math.max(-1, Math.min(1, val));

        const angleA = Math.acos(clamp((b * b + c * c - a * a) / (2 * b * c)));
        const angleB = Math.acos(clamp((a * a + c * c - b * b) / (2 * a * c)));
        const angleC = Math.acos(clamp((a * a + b * b - c * c) / (2 * a * b)));

        return {
            sides: { a, b, c },
            angles: { A: toDegrees(angleA), B: toDegrees(angleB), C: toDegrees(angleC) }
        };
    }

    // INPUT HANDLERS
    function updateFromInputs() {
        const newA = parseFloat(inputs.sideA.value);
        const newB = parseFloat(inputs.sideB.value);
        const newC = parseFloat(inputs.sideC.value);

        if (isNaN(newA) || isNaN(newB) || isNaN(newC) || newA <= 0 || newB <= 0 || newC <= 0) return;

        // Check Triangle Inequality
        if (newA + newB <= newC || newA + newC <= newB || newB + newC <= newA) {
            // Invalid triangle
            return;
        }

        // Current points
        const A = state.points.A;

        // 1. Update AB (side c). Keep A fixed, move B along the current line AB.
        const currentC = distance(state.points.A, state.points.B);
        let angleAB = 0;
        if (currentC > 0) {
            angleAB = Math.atan2(state.points.B.y - state.points.A.y, state.points.B.x - state.points.A.x);
        }

        // New position for B
        state.points.B.x = A.x + newC * Math.cos(angleAB);
        state.points.B.y = A.y + newC * Math.sin(angleAB);

        // 2. Find C (intersection of circle A with radius b and circle B with radius a)
        // Law of Cosines to find angle A
        const cosAngleA = (newB * newB + newC * newC - newA * newA) / (2 * newB * newC);
        const angleA_rad = Math.acos(Math.max(-1, Math.min(1, cosAngleA)));

        // There are two solutions for C. We should pick the one closest to the current C to prevent flipping.
        const candidateC1 = {
            x: A.x + newB * Math.cos(angleAB + angleA_rad),
            y: A.y + newB * Math.sin(angleAB + angleA_rad)
        };
        const candidateC2 = {
            x: A.x + newB * Math.cos(angleAB - angleA_rad),
            y: A.y + newB * Math.sin(angleAB - angleA_rad)
        };

        const dist1 = distance(candidateC1, state.points.C);
        const dist2 = distance(candidateC2, state.points.C);

        if (dist1 < dist2) {
            state.points.C = candidateC1;
        } else {
            state.points.C = candidateC2;
        }

        updateUI(true); // pass true to skip updating inputs
    }

    [inputs.sideA, inputs.sideB, inputs.sideC].forEach(input => {
        input.addEventListener('input', updateFromInputs);
    });

    function updateUI(skipInputs = false) {
        const geo = calculateGeometry();

        if (!skipInputs) {
            inputs.sideA.value = geo.sides.a.toFixed(1);
            inputs.sideB.value = geo.sides.b.toFixed(1);
            inputs.sideC.value = geo.sides.c.toFixed(1);
        }

        inputs.angleA.value = geo.angles.A.toFixed(1);
        inputs.angleB.value = geo.angles.B.toFixed(1);
        inputs.angleC.value = geo.angles.C.toFixed(1);

        draw();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { A, B, C } = state.points;

        // Draw Triangle Fill
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fillStyle = CONFIG.fillColor;
        ctx.fill();

        // Draw Edges
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.strokeStyle = CONFIG.lineColor;
        ctx.lineWidth = CONFIG.lineWidth;
        ctx.stroke();

        // Draw Vertices
        drawVertex(A, "A");
        drawVertex(B, "B");
        drawVertex(C, "C");
    }

    function drawVertex(point, label) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, CONFIG.vertexRadius, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.vertexColor;
        ctx.fill();

        // Label
        ctx.fillStyle = CONFIG.labelColor;
        ctx.font = CONFIG.labelFont;
        // Offset label slightly
        let offsetX = 15;
        let offsetY = 15;
        if (point.y < 200) offsetY = -15; // Above center
        if (point.x < 300) offsetX = -15; // Left of center

        ctx.fillText(label, point.x + offsetX, point.y + offsetY);
    }

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function isOverVertex(pos, vertex) {
        return distance(pos, vertex) < CONFIG.vertexRadius * 2; // Hitbox slightly larger
    }

    // Event Listeners
    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);

        for (const key in state.points) {
            if (isOverVertex(pos, state.points[key])) {
                state.dragging = key;
                state.dragOffset.x = pos.x - state.points[key].x;
                state.dragOffset.y = pos.y - state.points[key].y;
                canvas.style.cursor = 'grabbing';
                return;
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);

        if (state.dragging) {
            state.points[state.dragging].x = pos.x - state.dragOffset.x;
            state.points[state.dragging].y = pos.y - state.dragOffset.y;
            updateUI();
        } else {
            // Hover effect cursor
            let hovering = false;
            for (const key in state.points) {
                if (isOverVertex(pos, state.points[key])) {
                    hovering = true;
                    break;
                }
            }
            canvas.style.cursor = hovering ? 'grab' : 'crosshair';
        }
    });

    canvas.addEventListener('mouseup', () => {
        state.dragging = null;
        canvas.style.cursor = 'crosshair';
    });

    canvas.addEventListener('mouseleave', () => {
        state.dragging = null;
        canvas.style.cursor = 'crosshair';
    });

    // Initial Draw
    updateUI();

    // CHAT LOGIC
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');

    function appendMessage(sender, text, distinctClass, extraContent = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${distinctClass}`;

        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = text;

        msgDiv.appendChild(bubble);

        if (extraContent) {
            msgDiv.appendChild(extraContent);
        }

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function handleChat() {
        const query = chatInput.value.trim();
        if (!query) return;

        // User Message
        appendMessage('You', query, 'user');
        chatInput.value = '';

        // Prepare Geometry Context
        const geo = calculateGeometry();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    sides: geo.sides,
                    angles: geo.angles
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            // Bot Response
            const extraContainer = document.createElement('div');

            if (data.rule) {
                const ruleDiv = document.createElement('div');
                ruleDiv.className = 'rule-box';
                ruleDiv.textContent = `💡 Rule: ${data.rule}`;
                extraContainer.appendChild(ruleDiv);
            }

            if (data.steps && data.steps.length > 0) {
                const stepsUl = document.createElement('ul');
                stepsUl.className = 'steps-list';
                data.steps.forEach(step => {
                    const li = document.createElement('li');
                    li.textContent = step;
                    stepsUl.appendChild(li);
                });
                extraContainer.appendChild(stepsUl);
            }

            appendMessage('Tutor', data.answer, 'bot', extraContainer);

        } catch (error) {
            appendMessage('Tutor', "Sorry, I encountered an error answering that.", 'bot');
            console.error('Chat error:', error);
        }
    }

    sendButton.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

});
