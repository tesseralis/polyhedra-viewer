import json
import sys
import os

def vertex_to_obj(vertex):
    x, y, z = vertex
    return f"v {x} {y} {z}"

def face_to_obj(face):
    face_string = ' '.join(str(v+1) for v in face)
    return f"f {face_string}"

def to_obj(solid):
    vertices = solid['vertices']
    faces = solid['faces']
    return '\n'.join(list(map(vertex_to_obj, vertices)) + list(map(face_to_obj, faces)))

if __name__ == '__main__':
    read_dir = sys.argv[1]
    write_dir = sys.argv[2]

    for filename in os.listdir(read_dir):
        with open(read_dir + '/' + filename) as f:
            polyhedron = json.load(f)
        base, ext = filename.split('.')
        with open(write_dir + '/' + base + '.obj', 'w') as f:
            f.write(to_obj(polyhedron))
    
