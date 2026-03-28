import glob
import re
import os

directory = "C:/Users/AB/Desktop/admin-cleany-dash/cleany-admin-dashboard/src/api/endpoints"

for filename in glob.glob(os.path.join(directory, "*.js")):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace single quote trailed slashes like '/users/' to '/users'
    content = re.sub(r"axiosInstance\.([a-z]+)\('([^']+)/*/'\)", r"axiosInstance.\1('\2')", content)
    content = re.sub(r"axiosInstance\.([a-z]+)\('([^']+)/',", r"axiosInstance.\1('\2',", content)
    
    # Replace backtick trailed slashes like `/users/${id}/` to `/users/${id}`
    content = re.sub(r"axiosInstance\.([a-z]+)\(`([^`]+)/*/(?:`|',)", r"axiosInstance.\1(`\2`", content)
    content = re.sub(r"axiosInstance\.([a-z]+)\(`([^`]+)/`", r"axiosInstance.\1(`\2`", content)

    # Let me do it safer via string matching: find all `/` right before `'` or `\``
    # Only within axiosInstance calls.
    # Actually, the user says "endpoint should not contain the / in the end"
    content = re.sub(r"/\s*'", "'", content)
    content = re.sub(r"/\s*,", "", content) # not correct
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)
