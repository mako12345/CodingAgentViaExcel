import random, math, time

class Drone:
    def __init__(self, did):
        self.id = did
        self.x = random.uniform(-10, 10)
        self.y = random.uniform(0, 20)
        self.z = random.uniform(-10, 10)
        self.battery = random.uniform(60, 100)
        self.speed = random.uniform(0, 10)
        self.altitude = self.y
        self.status = "flying"
        self.heading = random.uniform(0, 360)
        self.history = []

    def update(self):
        self.x += random.uniform(-0.5, 0.5)
        self.z += random.uniform(-0.5, 0.5)
        self.y += random.uniform(-0.3, 0.3)
        self.y = max(0.5, min(30, self.y))
        self.x = max(-15, min(15, self.x))
        self.z = max(-15, min(15, self.z))
        self.battery = max(0, self.battery - random.uniform(0, 0.2))
        self.speed = max(0, min(20, self.speed + random.uniform(-1, 1)))
        self.altitude = self.y
        self.heading = (self.heading + random.uniform(-10, 10)) % 360
        if self.battery < 10:
            self.status = "critical"
        elif self.battery < 20:
            self.status = "warning"
        else:
            self.status = "flying"
        ts = time.time()
        self.history.append({"t": ts, "x": round(self.x,2),
                              "y": round(self.y,2), "z": round(self.z,2),
                              "bat": round(self.battery,1)})
        if len(self.history) > 60:
            self.history.pop(0)

    def to_dict(self):
        return {
            "id": self.id, "x": round(self.x,2), "y": round(self.y,2),
            "z": round(self.z,2), "battery": round(self.battery,1),
            "speed": round(self.speed,1), "altitude": round(self.altitude,1),
            "status": self.status, "heading": round(self.heading,1),
            "history": self.history[-20:]
        }

class DroneSimulator:
    def __init__(self, num_drones=4):
        self.drones = {f"D{i+1}": Drone(f"D{i+1}") for i in range(num_drones)}

    def update(self):
        for d in self.drones.values():
            d.update()

    def get_all(self):
        return [d.to_dict() for d in self.drones.values()]

    def command(self, drone_id, cmd, params):
        if drone_id not in self.drones:
            return "error: drone not found"
        d = self.drones[drone_id]
        if cmd == "land":
            d.status = "landing"
        elif cmd == "takeoff":
            d.status = "flying"
            d.y = max(d.y, 2.0)
        elif cmd == "goto":
            d.x = float(params.get("x", d.x))
            d.y = float(params.get("y", d.y))
            d.z = float(params.get("z", d.z))
        elif cmd == "return_home":
            d.x, d.z = 0.0, 0.0
            d.status = "returning"
        return "ok"
