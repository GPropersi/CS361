import os
import random
import time

NUM_OF_IMAGES = len(os.listdir("images"))

def prng_service():
    print("PRNG Service Listening...")
    while True:
        run_service = False

        with open("prng-service.txt", 'r', newline='') as prng_service_txt_file:
            lines_in_file = prng_service_txt_file.readlines()

            if not lines_in_file or len(lines_in_file) > 1:
                continue
            
            line_in_file = lines_in_file.pop()
            line_in_file = line_in_file.strip()

            if line_in_file == "run":
                time.sleep(2)
                run_service = True

        if run_service:
            with open("prng-service.txt", 'w', newline='') as prng_service_txt_file:
                time.sleep(1)
                random_num = random.choice(range(0, NUM_OF_IMAGES))
                prng_service_txt_file.writelines([str(random_num)])

if __name__ == "__main__":
    prng_service()