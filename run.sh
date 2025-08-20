#!/bin/bash

python3 facefusion_batch.py \
    data/src/MillieBobbyBrown.jpg \
    data/trgt \
    data/out \
    --facefusion-path ~/code/facefusion/facefusion \
    --provider cpu
