import os
import random
import time

NUM_OF_IMAGES = set([val for val in range(len(os.listdir("images")))])

def img_service():
    all_image_files = [file.replace("image-", "") for file in os.listdir("images")]
    images_and_extension = dict()
    for image_file in all_image_files:
        file_num, file_extension = image_file.split('.')
        images_and_extension[int(file_num)] = file_extension

    print("Image Service Listening...")
    previously_run = None
    while True:
        run_service = False

        with open("prng-service.txt", 'r', newline='') as img_txt_file:
            lines_in_file = img_txt_file.readlines()

            if not lines_in_file or len(lines_in_file) > 1:
                continue
            
            line_in_file = lines_in_file.pop()
            line_in_file = line_in_file.strip()

            try:
                if int(line_in_file) in NUM_OF_IMAGES:
                    run_service = True
            except ValueError:
                continue

        if run_service:
            image_file_num = int(line_in_file)
            image_file_extension = images_and_extension[image_file_num]
            image_file = f"images/image-{image_file_num}.{image_file_extension}"

            if image_file != previously_run:
                with open("image-service.txt" , 'w', newline='') as img_txt_file:
                    img_txt_file.writelines([image_file])

                previously_run = image_file

if __name__ == "__main__":
    img_service()