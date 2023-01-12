import os

for idx, file in enumerate(os.listdir("images")):
    orig_file_name = "images//" + file
    extension = orig_file_name[-3:]
    new_file_name = f"images//image-{idx}.{extension}"
    os.rename(orig_file_name, new_file_name)