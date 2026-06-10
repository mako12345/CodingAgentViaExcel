from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import threading, time, json, os, datetime
from drone_sim import DroneSimulator

app = Flask(__name__)
app.config['SECRET_KEY'] = 'drone_secret_2024'
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='eventlet')

sim = DroneSimulator(num_drones=4)
logs = []
settings = {
    "update_interval": 1.0,
    "grid_size": 20,
    "alert_battery": 20,
    "alert_altitude": 50
}

def log(msg, level="INFO"):
    entry = {"time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
             "level": level, "msg": msg}
    logs.append(entry)
    if len(logs) > 500:
        logs.pop(0)

def broadcast_loop():
    while True:
        sim.update()
        data = sim.get_all()
        socketio.emit('drone_update', data)
        time.sleep(settings["update_interval"])

@app.route('/')
def index():
    return render_template('index.html', settings=settings)

@app.route('/logs')
def logs_page():
    return render_template('logs.html', logs=logs[-100:])

@app.route('/settings')
def settings_page():
    return render_template('settings.html', settings=settings)


@app.route('/api/settings', methods=['GET','POST'])
def api_settings():
    global settings
    if request.method == 'POST':
        data = request.get_json()
        settings.update(data)
        log(f"Settings updated: {data}")
        return jsonify({"status": "ok"})
    return jsonify(settings)

@app.route('/api/logs')
def api_logs():
    level = request.args.get('level', '')
    result = [l for l in logs if not level or l['level'] == level]
    return jsonify(result[-200:])

@app.route('/api/drones')
def api_drones():
    return jsonify(sim.get_all())

@app.route('/api/command', methods=['POST'])
def api_command():
    data = request.get_json()
    drone_id = data.get('drone_id')
    cmd = data.get('command')
    params = data.get('params', {})
    result = sim.command(drone_id, cmd, params)
    log(f"CMD drone={drone_id} cmd={cmd} params={params} result={result}")
    return jsonify({"status": result})

@socketio.on('connect')
def on_connect():
    log(f"Client connected: {request.sid}", "INFO")
    emit('drone_update', sim.get_all())

@socketio.on('disconnect')
def on_disconnect():
    log(f"Client disconnected: {request.sid}", "INFO")

if __name__ == '__main__':
    t = threading.Thread(target=broadcast_loop, daemon=True)
    t.start()
    log("DroneMonitor started")
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)
