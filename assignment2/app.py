from flask import Flask
import os
import shutil
import time

app = Flask(__name__)

BASIC_PAGE = '<form action="/show_image" method="get" target="_blank"><button type="submit">Click me</button></form>'
IMAGE_FILES = set(["images/" + file for file in os.listdir("images")])

@app.route('/')
def hello():
    with open("prng-service.txt", 'w', newline='') as prng_service_file:
        prng_service_file.writelines('')

    with open("image-service.txt", 'w', newline='') as image_service_file:
        image_service_file.writelines('')

    return BASIC_PAGE

@app.route('/show_image')
def show_image():
    with open("prng-service.txt", 'w', newline='') as prng_service_file:
        prng_service_file.writelines(['run'])

    time.sleep(5)

    image_dir = 'static/images'
    for f in os.listdir(image_dir):
        os.remove(os.path.join(image_dir, f))

    with open("image-service.txt", 'r', newline='') as image_service_file:
        image_selected = image_service_file.readline()

    if image_selected not in IMAGE_FILES:
        print(f"{image_selected=}")
        return "Image not available", 404

    shutil.copy(image_selected, image_dir)
    new_image_selected = "static/" + image_selected

    image = f'<img src="{new_image_selected}" alt="User Image">'
    return image

if __name__ == "__main__":
    app.run(debug=True)