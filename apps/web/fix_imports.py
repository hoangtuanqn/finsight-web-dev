import os
import re

def fix_imports(directory):
    relative_import_re = re.compile(r"from\s+(['\"])(\.\.?/[^'\"]+)\.jsx?(['\"])")
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = relative_import_re.sub(r"from \1\2\3", content)
                
                if content != new_content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed: {path}")

if __name__ == "__main__":
    fix_imports('src')
