from flask import Flask
import os
import shutil
import time

app = Flask(__name__)

BASIC_PAGE = '<form action="/show_image" method="get" target="_blank"><button type="submit" style="height:200px;width:200px">Click me</button></form>'
IMAGE_FILES = set(["images/" + file for file in os.listdir("images")])
NUM_OF_IMAGES = set([val for val in range(len(os.listdir("images")))])

@app.route('/')
def hello():
    with open("prng-service.txt", 'w', newline='') as prng_service_file:
        prng_service_file.writelines('')

    with open("image-service.txt", 'w', newline='') as image_service_file:
        image_service_file.writelines('')

    # Clear all images in static folder
    image_dir = 'static/images'
    for f in os.listdir(image_dir):
        os.remove(os.path.join(image_dir, f))

    return BASIC_PAGE

@app.route('/show_image')
def show_image():
    # Write RUN to the PRNG service file
    with open("prng-service.txt", 'w', newline='') as prng_service_file:
        prng_service_file.writelines(['run'])

    time.sleep(10)

    # Read the PRNG file that should contain a random number
    random_num = read_prng_file_and_return_number()

    if random_num == -1:
        return "Number not generated", 404

    # Write the random num to image-service.txt file
    write_img_file_random_number(random_num)

    # Read the image file path
    time.sleep(10) 
    with open("image-service.txt", 'r', newline='') as image_service_file:
        image_selected = image_service_file.readline()

    if image_selected not in IMAGE_FILES:
        print(f"{image_selected=}")
        return "Image not available", 404

    image_dir = 'static/images'
    shutil.copy(image_selected, image_dir)
    new_image_selected = "static/" + image_selected

    image = f'<img src="{new_image_selected}" alt="User Image" width="400" height="auto">'
    return image

def read_prng_file_and_return_number() -> int:
    with open("prng-service.txt", 'r', newline='') as edited_prng_service_file:
        lines_in_file = edited_prng_service_file.readlines()

    print(lines_in_file)

    if not lines_in_file or len(lines_in_file) > 1:
        return -1
    
    line_in_file = lines_in_file.pop()
    line_in_file = line_in_file.strip()

    try:
        if int(line_in_file) in NUM_OF_IMAGES:
            run_service = True

            return int(line_in_file)

    except ValueError:
        return -1

def write_img_file_random_number(number: int):
    with open("image-service.txt", 'w', newline='') as image_service_file:
        image_service_file.writelines([str(number)])
    time.sleep(10)

if __name__ == "__main__":
    app.run(debug=True)