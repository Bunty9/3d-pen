I want to start a project it is a multi disciplinary skilled project,
It's a hardware product collecting real-time data, used to train and predict using dl neural model
We need agents with specific skills that will read documentation, explore, research and ideate on how we are going to solve the task at hand to contribute to the project
The agent should find research papers on the subject at hand and try to understand standard solutions and procedures, then the agent should find open source technologies, if its a software problem, or manufacturing solutions for a hardware problem, then get the manual or documentation for that technology and train and understand the methodology and draft your understanding and interface so that you can work with that technology to design develop and ideate over the problem break down the problem into multiple domains, in each domain break down the domain to multiple tasks, each task will be handled by the domain agent, from designing, architecture, development, hardware, software, testing, debugging, infrastructure, etc
Download, Clone, Read and Explore all the github repositories, open-source technologies, download, softwares and check if we can integrate an interface with Agent LLM prioritywise - direct CLI, MCP, API, etc then get specific skills from web for the specific technology, use the skills to plan out and execute the task.

Idea: a pen with sensors and sensitivity tracking that can use a normal gel pen refill commonly available the case is designed such that it has all the sensors in it charges via wireless charging and can be used as a normal gel pen but is sending all your movements, sensitivity you pressure, in real time to some host, that software host will translate all the realtime data using some model and will be interpreted directly into a 2d digital canvas and the pen can connect to os devices and register as a digital pen and work with all the canvas apps, like paint. Register as an input device.

Features :
Sensors- capacitive, pressure, some accelerators, piezo etc
Mcu- some dedicated 32bit lowpower, and with low latency high bandwidth communication protocol available we need to send data like other wireless mice do in high resolution and in around 8K hertz
Steam all sensors data -> train model over sensors -> use labeled data (use the sensor data in a session and validate with a scanned copy of the paper the pen was used during that session)
Train model with live data tune parameters, end result should steam data realtime and model should interpret the data in to a live canvas later can be character recognized to understand what's written
Most efficient and long running communication protocol
Low energy electronics
Low energy haptics for feedback in pen
Low energy press sensitive areas as input buttons
High sensitivity piezo pressure sensor
3D accelerometer sensor to get realtime 3d location and orientation in realtime 2 each on one end
Need communication system to send data in highest resolution given by the sensors real time in lowest latency and in most frequent intervals as possible
Then will will have excellent battery management system and monitoring system with wireless chagrin coils
The pen will twist open from the top end(pen nib holding side) and user can insert a gel pen refill compatible with the pen specification and use as normal pen
The pen will have an array of touch sensors in a line running parallel to the pen to accept users taps that can be used as multifunction buttons to activate some modes or features.
Hardware: the refill is 110mm in length and 6mm in diameter
a normal pen is around 150mm in length and 11mm in diameter
We will have flexible pcb that is wrapped round on the code of the plastic inner body of the pen that houses the refill and the flexible pcb is designed such that it has components and structures inbuilt in the pcb when rolled on to the body all the sections align in the right places and the pcb is cutout in a form so it can be rolled helically round the code, it will house all the circuitry wog the wireless charging, could, sensors, communication, mcu, switches, etc on the flex pcb and when rolled on the shell they are designed such that they fall into the right place
In length parallel to the axis of the pen we have around 40mm to place a pressure sensitive sensor that will be responsible for letting us know how much pressure the user is applying in the nib of the pen and will be placed directly behind the refill and behind that will be the li-ion battery
So we have enough space in the cylindrical cavity by design
The pen will be enclosed with a hard shell and the top end will be given a screwable top that will be the nib end of the pen
We need to think of the geometry of the flex pcb, use the minimalist of hardware, raw sensors, we are not going to compute anything on the pen itself it will just connect to the host and stream all the data which will be later processed
For initial pieces we will include flex pcb connectors that will be used as debugging, firmware uploads, this will be flex pcb itself some end terminating into a flex connector that can be used to connect on a flexible connector port on some other debugging board made specifically for this flex pcb
The flex pcb will have features like copper coils made directly on the flexible pcb such when the pcb is rolled they fall in the right orientation and in the right place on the pen and according to that the wireless charging dock can be designed

Drafts:
check docs/assets/images/IMG_20260221_120103~2.jpg.jpeg
