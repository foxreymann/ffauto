#

in @batch_process.js where you get results at line 214

loop over results with success is false to extract failed images

then try to proccessImage the failed images once again, but only once


#

for the source image it shouldn't read file name from line 15, it should find first file in /data/src directory and use it as source

#

now for each image check the size 

if size is greater than 2048 * 1080 skip 'face_enhancer' processor


#

Workflow to automate:

1. Start Facefusion
2. Change settings
3. Choose source photo
4. Choose target photo
5. Wait for preview
6. Click start
7. Download output
repeat 4 to 7 in a loop

read the https://docs.facefusion.io/installation

and make me a python script that is going to do the job that my mate is doing manually

so apply face fusion from one source image to multiple targets

params:
source image
directory with target images
output directory
