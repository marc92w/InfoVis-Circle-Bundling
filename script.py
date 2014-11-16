#!/usr/bin/env python

import os
import errno

def path_hierarchy(path):
    hierarchy = {
        'type': 'directory',
        'name': os.path.basename(path),
        'size': os.path.getsize(path)
        }

    try:
        hierarchy['children'] = [
            path_hierarchy(os.path.join(path, contents))
            for contents in os.listdir(path)
        ]
    except OSError as e:
        if e.errno != errno.ENOTDIR:
            raise
        hierarchy['type'] = 'file'
        hierarchy['type'] = os.path.splitext(hierarchy['name'])[1]

    return hierarchy

if __name__ == '__main__':
    import json
    import sys

    try:
        directory = sys.argv[1]
    except IndexError:
        directory = "."

    print(json.dumps(path_hierarchy(directory), indent=2, sort_keys=True))
