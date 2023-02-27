import random
import time
import requests

def generate_random_word():
    with open("service.txt", "w") as f:
        random_num = random.randint(3,9)
        print(random_num)
        response = requests.get(f'https://random-word-api.vercel.app/api?words=1&length={random_num}')
        data = response.json()
        f.write(f"{data}\n")
        print(f"Word: {data}")
    print("Word printed.")

if __name__ == '__main__':
    print("Listening for word request...")
    while True:
        time.sleep(1.0)
        with open("service.txt", "r") as f:
            line = f.readline().strip()
        if line == "run":
            print("Generating random word...")
            generate_random_word()