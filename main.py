from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)

class GeometryTutor:
    def __init__(self):
        pass

    def solve(self, query, sides, angles):
        query = query.lower()
        a, b, c = sides['a'], sides['b'], sides['c']
        A, B, C = angles['A'], angles['B'], angles['C']

        response = {
            "answer": "",
            "steps": [],
            "rule": ""
        }

        if "area" in query:
            # Heron's Formula
            s = (a + b + c) / 2
            area = math.sqrt(s * (s - a) * (s - b) * (s - c))
            response["answer"] = f"The area is {area:.2f} square units."
            response["rule"] = "Heron's Formula: Area = √(s(s-a)(s-b)(s-c)), where s is the semi-perimeter."
            response["steps"] = [
                f"1. Calculate semi-perimeter s = ({a:.1f} + {b:.1f} + {c:.1f}) / 2 = {s:.2f}",
                f"2. Apply formula: √({s:.2f} * ({s:.2f}-{a:.1f}) * ({s:.2f}-{b:.1f}) * ({s:.2f}-{c:.1f}))",
                f"3. Result: {area:.2f}"
            ]
        
        elif "perimeter" in query:
            p = a + b + c
            response["answer"] = f"The perimeter is {p:.2f} units."
            response["rule"] = "Perimeter = a + b + c"
            response["steps"] = [
                f"1. Sum all sides: {a:.1f} + {b:.1f} + {c:.1f}",
                f"2. Result: {p:.2f}"
            ]

        elif "type" in query:
            # By Side
            side_type = "Scalene"
            if math.isclose(a, b) and math.isclose(b, c):
                side_type = "Equilateral"
            elif math.isclose(a, b) or math.isclose(b, c) or math.isclose(a, c):
                side_type = "Isosceles"
            
            # By Angle
            angle_type = "Acute"
            if math.isclose(A, 90) or math.isclose(B, 90) or math.isclose(C, 90):
                angle_type = "Right"
            elif A > 90 or B > 90 or C > 90:
                angle_type = "Obtuse"

            response["answer"] = f"This is a {side_type} {angle_type} triangle."
            response["rule"] = "Classification by sides (Equilateral, Isosceles, Scalene) and angles (Acute, Right, Obtuse)."
            steps = []
            
            if side_type == "Equilateral":
                steps.append("All sides are equal -> Equilateral")
            elif side_type == "Isosceles":
                steps.append("Two sides are equal -> Isosceles")
            else:
                steps.append("No sides are equal -> Scalene")

            if angle_type == "Right":
                steps.append("One angle is 90° -> Right")
            elif angle_type == "Obtuse":
                steps.append("One angle is > 90° -> Obtuse")
            else:
                steps.append("All angles are < 90° -> Acute")
                
            response["steps"] = steps

        else:
            response["answer"] = "I can help you calculate the Area, Perimeter, or Type of this triangle. Try asking 'Calculate the area'!"
            response["rule"] = "I am a simple geometry bot."
        
        return response

tutor = GeometryTutor()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    query = data.get('query')
    sides = data.get('sides')
    angles = data.get('angles')
    
    if not query or not sides or not angles:
        return jsonify({"error": "Missing data"}), 400
        
    return jsonify(tutor.solve(query, sides, angles))

if __name__ == "__main__":
    print("TriangleApp Bot starting on http://localhost:3000")
    app.run(debug=True, port=3000)
