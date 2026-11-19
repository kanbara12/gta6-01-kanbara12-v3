// Procedural vehicle models for SUNCOAST: HEATLINE.
// One clear job: build every vehicle out of geometry — no imported art.
//
// HERO CAR REWORK (the v5 failure): the old car was two stacked boxes.
// The new HEATLINE GT is a sharp sports silhouette: a low sloped hood,
// a raked reflective windshield and rear glass, flared wheel arches with
// real tires and rims, a rear spoiler, twin exhausts, glowing emissive
// brake lights, and a driver visible through the glass.

import * as THREE from 'three';

function std(color, rough = 0.35, metal = 0.7) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function glassMat() {
  return new THREE.MeshStandardMaterial({
    color: 0x1a2a3a, roughness: 0.08, metalness: 0.9, transparent: true, opacity: 0.85,
  });
}

function makeWheel() {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.32, 18),
    std(0x141414, 0.95, 0.1),
  );
  tire.rotation.z = Math.PI / 2;
  g.add(tire);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.34, 10),
    std(0xd8d8d8, 0.25, 0.9),
  );
  rim.rotation.z = Math.PI / 2;
  g.add(rim);
  return g;
}

/** The hero car: HEATLINE GT. Long nose, low roof, wide stance. */
export function buildHeroCar() {
  const car = new THREE.Group();
  const paint = std(0xc0392b, 0.28, 0.75); // sunset red
  const dark = std(0x181c22, 0.5, 0.6);

  // Low main body: long, wide, hugging the ground.
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.9), paint);
  body.position.y = 0.62;
  body.castShadow = true;
  car.add(body);

  // Sloped hood: a wedge rising from the nose to the windshield base.
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, 1.5), paint);
  hood.position.set(0, 0.95, 1.55);
  hood.rotation.x = -0.16;
  hood.castShadow = true;
  car.add(hood);

  // Cabin: tapered greenhouse, set back, with raked glass front and rear.
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.0), paint);
  cabin.position.set(0, 1.08, -0.35);
  cabin.castShadow = true;
  car.add(cabin);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.15), glassMat());
  windshield.position.set(0, 1.18, 0.62);
  windshield.rotation.x = -0.62; // raked back hard
  car.add(windshield);
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 1.0), glassMat());
  rearGlass.position.set(0, 1.16, -1.28);
  rearGlass.rotation.x = 0.55;
  car.add(rearGlass);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 1.1), paint);
  roof.position.set(0, 1.36, -0.35);
  car.add(roof);

  // Side skirts + flared arches: dark trim that breaks the slab look.
  for (const sx of [-1, 1]) {
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 4.4), dark);
    skirt.position.set(sx * 1.02, 0.42, 0);
    car.add(skirt);
    for (const wz of [1.55, -1.55]) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.09, 8, 16, Math.PI), dark);
      arch.position.set(sx * 1.0, 0.45, wz);
      arch.rotation.y = Math.PI / 2;
      car.add(arch);
    }
  }

  // Wheels: big, pushed to the corners.
  const wheelPos = [[-0.95, 1.55], [0.95, 1.55], [-0.95, -1.55], [0.95, -1.55]];
  car.userData.wheels = [];
  for (const [wx, wz] of wheelPos) {
    const w = makeWheel();
    w.position.set(wx, 0.42, wz);
    car.add(w);
    car.userData.wheels.push(w);
  }

  // Rear spoiler, twin exhausts, headlights, glowing brake lights.
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.4), dark);
  spoiler.position.set(0, 1.28, -2.35);
  car.add(spoiler);
  for (const sx of [-0.35, 0.35]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.3, 10), std(0x888888, 0.3, 0.9));
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(sx, 0.45, -2.5);
    car.add(pipe);
  }
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6c9 });
  for (const sx of [-0.7, 0.7]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.06), headMat);
    h.position.set(sx, 0.72, 2.47);
    car.add(h);
  }
  const brakeMat = new THREE.MeshBasicMaterial({ color: 0xff2211 });
  car.userData.brakeMat = brakeMat;
  for (const sx of [-0.7, 0.7]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.06), brakeMat);
    b.position.set(sx, 0.78, -2.47);
    car.add(b);
  }

  // Driver visible through the glass: torso + helmet.
  const driver = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.35), std(0x222831, 0.8, 0.1));
  torso.position.y = 1.05;
  driver.add(torso);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), std(0xf2ead8, 0.4, 0.3));
  helmet.position.y = 1.38;
  driver.add(helmet);
  driver.position.set(-0.35, 0, -0.35);
  car.add(driver);

  car.userData.kind = 'hero';
  car.userData.speed = 0;
  return car;
}

/** A generic traffic car: boxier, muted paint, no spoiler. */
export function buildTrafficCar(color) {
  const car = new THREE.Group();
  const paint = std(color, 0.4, 0.6);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 4.2), paint);
  body.position.y = 0.65; body.castShadow = true;
  car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.0), glassMat());
  cabin.position.set(0, 1.2, -0.2);
  car.add(cabin);
  for (const [wx, wz] of [[-0.9, 1.4], [0.9, 1.4], [-0.9, -1.4], [0.9, -1.4]]) {
    const w = makeWheel();
    w.scale.setScalar(0.92);
    w.position.set(wx, 0.4, wz);
    car.add(w);
  }
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6c9 });
  for (const sx of [-0.6, 0.6]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), headMat);
    h.position.set(sx, 0.7, 2.12);
    car.add(h);
  }
  car.userData.kind = 'traffic';
  car.userData.speed = 0;
  return car;
}

/** A police interceptor: black-and-white, light bar, push bar. */
export function buildPoliceCar(callsign) {
  const car = buildTrafficCar(0xf2f2f2);
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.92, 0.4, 1.6),
    std(0x1a1d22, 0.4, 0.6),
  );
  door.position.set(0, 0.65, -0.2);
  car.add(door);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 0.3), std(0x111111, 0.4, 0.5));
  bar.position.set(0, 1.55, -0.2);
  car.add(bar);
  const red = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.26), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  red.position.set(-0.35, 1.68, -0.2);
  car.add(red);
  const blue = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.26), new THREE.MeshBasicMaterial({ color: 0x2244ff }));
  blue.position.set(0.35, 1.68, -0.2);
  car.add(blue);
  car.userData.redLight = red;
  car.userData.blueLight = blue;
  car.userData.callsign = callsign;
  car.userData.kind = 'police';
  car.userData.state = 'PATROL';
  car.userData.speed = 0;
  return car;
}

/** Police helicopter SKY-1 — built to READ in a screenshot: a fat rotor
 *  disc (spinning, translucent), a solid body with a glass nose, tail
 *  boom, skids, and a spotlight cone that sweeps the road below. */
export function buildHelicopter() {
  const heli = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.8, 4.6),
    std(0x2b3a4a, 0.4, 0.6),
  );
  body.castShadow = true;
  heli.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), glassMat());
  nose.scale.set(1, 0.85, 1.1);
  nose.position.set(0, -0.1, 2.2);
  heli.add(nose);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 5, 8), std(0x2b3a4a, 0.4, 0.6));
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 0.3, -4.2);
  heli.add(boom);
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 1.2), std(0x2b3a4a, 0.4, 0.6));
  tailFin.position.set(0, 0.9, -6.4);
  heli.add(tailFin);
  // Rotor mast + blades + the translucent disc that makes spin visible.
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8), std(0x111111, 0.5, 0.5));
  mast.position.y = 1.3;
  heli.add(mast);
  const rotor = new THREE.Group();
  rotor.position.y = 1.85;
  const bladeMat = std(0x111111, 0.5, 0.5);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 6.4), bladeMat);
    blade.rotation.y = (i / 4) * Math.PI;
    rotor.add(blade);
  }
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(6.6, 32),
    new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.14, side: THREE.DoubleSide }),
  );
  disc.rotation.x = -Math.PI / 2;
  rotor.add(disc);
  heli.add(rotor);
  heli.userData.rotor = rotor;
  // Skids.
  for (const sx of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.6, 6), std(0x111111, 0.5, 0.5));
    skid.rotation.x = Math.PI / 2;
    skid.position.set(sx * 0.9, -1.2, 0);
    heli.add(skid);
  }
  // Spotlight: a real SpotLight plus a visible cone down to the road.
  const spot = new THREE.SpotLight(0xfff2b0, 900, 120, 0.35, 0.4, 1.2);
  spot.position.set(0, -0.8, 1.5);
  heli.add(spot);
  heli.add(spot.target);
  spot.target.position.set(0, -30, 6);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(4, 18, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }),
  );
  cone.rotation.x = Math.PI; // apex up at the heli
  cone.position.set(0, -9.5, 3);
  heli.add(cone);
  heli.userData.spot = spot;
  heli.userData.cone = cone;
  heli.userData.kind = 'heli';
  return heli;
}
