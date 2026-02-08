#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { addExtension, Packr, Unpackr } = require("msgpackr");
const { randomUUID } = require("crypto");

class He {
  constructor(value) {
    this.value = value;
  }
}

class Re {
  constructor(value) {
    this.value = value;
  }
}

class wr {
  constructor(value) {
    this.value = value;
  }
}

class pm {
  constructor(value) {
    this.value = value;
  }
}

class mm {
  constructor(value) {
    this.value = value;
  }
}

class lr {
  constructor(value) {
    this.value = value;
  }
}

const EXT_TYPES = [
  { Class: He, type: 1 },
  { Class: Re, type: 2 },
  { Class: wr, type: 3 },
  { Class: pm, type: 4 },
  { Class: mm, type: 5 },
  { Class: lr, type: 6 },
];

for (const ext of EXT_TYPES) {
  addExtension({
    Class: ext.Class,
    type: ext.type,
    read(value) {
      return new ext.Class(value);
    },
    write(instance) {
      return instance.value;
    },
  });
}

const unpackr = new Unpackr({ structuredClone: true });
const packr = new Packr({ structuredClone: true });

const ROOT = path.resolve(__dirname, "..");
const inputPath = path.join(ROOT, "public", "assets", "skills-keyboard.spline.backup");
const outputPath = path.join(ROOT, "public", "assets", "skills-keyboard.spline");

const EXTRA_KEYS_BY_ROW = {
  "row 0": ["gsap___", "pytorch"],
  "row 1": ["ec2____", "typeorm"],
  "row 2": ["yt_dlp_", "lenis__"],
  "row 3": ["kuroshi", "spline_"],
};

const NEW_KEY_X = [1240, 1550];

function unwrap(value) {
  return value && typeof value === "object" && "value" in value ? value.value : value;
}

function findByName(node, name) {
  if (!node || typeof node !== "object") {
    return null;
  }
  if (node.data && node.data.name === name) {
    return node;
  }
  for (const child of node.children || []) {
    const hit = findByName(child, name);
    if (hit) {
      return hit;
    }
  }
  return null;
}

function reassignTreeIds(node) {
  if (!node || typeof node !== "object") {
    return;
  }
  if (typeof node.id === "string") {
    node.id = randomUUID();
  }
  for (const child of node.children || []) {
    reassignTreeIds(child);
  }
}

function isTypedArrayLike(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.length === "number" &&
    typeof value.BYTES_PER_ELEMENT === "number"
  );
}

function assertSubdivGeometryBuffers(node, errors) {
  if (!node || typeof node !== "object") {
    return;
  }
  const geometry = node.data && node.data.geometry;
  if (geometry && geometry.type === "SubdivGeometry") {
    if (!isTypedArrayLike(geometry.positionWASM)) {
      errors.push(`${node.data.name || node.id}: positionWASM`);
    }
    if (!isTypedArrayLike(geometry.indexWASM)) {
      errors.push(`${node.data.name || node.id}: indexWASM`);
    }
    if (!isTypedArrayLike(geometry.verticesPerFaceWASM)) {
      errors.push(`${node.data.name || node.id}: verticesPerFaceWASM`);
    }
  }
  for (const child of node.children || []) {
    assertSubdivGeometryBuffers(child, errors);
  }
}

function main() {
  const raw = fs.readFileSync(inputPath);
  const sceneFile = unpackr.unpack(raw);

  const rootObjects = unwrap(sceneFile.scene.objects);
  const pageRoot = rootObjects[1];
  const keyboard = findByName(pageRoot, "keyboard");
  if (!keyboard) {
    throw new Error("Keyboard root not found.");
  }

  for (const [rowName, newNames] of Object.entries(EXTRA_KEYS_BY_ROW)) {
    const row = findByName(keyboard, rowName);
    if (!row) {
      throw new Error(`Row not found: ${rowName}`);
    }
    if (row.children.length < 1) {
      throw new Error(`Row has no keycaps: ${rowName}`);
    }

    const template = row.children[row.children.length - 1];
    for (let i = 0; i < 2; i++) {
      const clone = structuredClone(template);
      reassignTreeIds(clone);
      clone.data.name = newNames[i];
      clone.data.position[0] = NEW_KEY_X[i];
      row.children.push(clone);
    }
  }

  const body = findByName(keyboard, "body");
  if (!body || !body.data || !body.data.geometry || body.data.geometry.type !== "VectorGeometry") {
    throw new Error("Body VectorGeometry not found.");
  }

  const minX = [];
  const maxX = [];
  for (const rowName of Object.keys(EXTRA_KEYS_BY_ROW)) {
    const row = findByName(keyboard, rowName);
    const rowX = row.data.position[0];
    for (const key of row.children) {
      const x = rowX + key.data.position[0];
      minX.push(x);
      maxX.push(x);
    }
  }

  const worldMinX = Math.min(...minX);
  const worldMaxX = Math.max(...maxX);
  const sidePadding = 330;
  const targetWidth = (worldMaxX - worldMinX) + sidePadding * 2;

  body.data.geometry.width = targetWidth;

  const bufferErrors = [];
  assertSubdivGeometryBuffers(keyboard, bufferErrors);
  if (bufferErrors.length > 0) {
    throw new Error(`Invalid SubdivGeometry buffers on: ${bufferErrors.join(", ")}`);
  }

  const encoded = packr.pack(sceneFile);
  fs.writeFileSync(outputPath, encoded);

  console.log(`Wrote ${outputPath}`);
  console.log(`Set body.geometry.width=${targetWidth.toFixed(3)}`);
}

main();
