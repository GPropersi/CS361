
# Random Number Generator
This service generates a random integer number between a maximum and minimum value you provide.
## Requirements
You must have a text file called **num-service.txt** located in the same directory as the python file.
## How It Works

### Requesting Data
The microservice, once activated, will be listening to the **num-service.txt** file for an input.
The input must be formatted as two numbers, separated by a comma, with no additional characters. The left number must be the requested minimum, and the right number must be the requested maximum like so:

`20,30`

The microservice will split the line based on the comma character, and read in the requested minimum and maximum values.
It will then generate a random number between those two values, inclusive of both the minimum and maximum.

### Receiving Data
The microservice will then erase the **num-service.txt** file, and print to it the single randomly generated number, like so:

`25`

As the end user, you will only need to read the text file for the randomly generated number after inputting the minimum and maximum numbers separated by a comma.

# UML Sequence Diagram

[[/CS361_UML_Diagram_Random_Number_Generator.png]]