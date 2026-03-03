#!/bin/bash
MODELS_DIR="models"
mkdir -p $MODELS_DIR

BASE_URL="https://cs.stanford.edu/people/jcjohns/fast-neural-style/models"

declare -A MODELS=(
  ["starry_night"]="instance_norm/starry_night.t7"
  ["la_muse"]="instance_norm/la_muse.t7"
  ["mosaic"]="instance_norm/mosaic.t7"
  ["candy"]="instance_norm/candy.t7"
  ["udnie"]="instance_norm/udnie.t7"
  ["rain_princess"]="instance_norm/rain_princess.t7"
  ["the_scream"]="instance_norm/the_scream.t7"
  ["feathers"]="instance_norm/feathers.t7"
)

for name in "${!MODELS[@]}"; do
  echo "Downloading ${name}..."
  wget -O "${MODELS_DIR}/${name}.t7" "${BASE_URL}/${MODELS[$name]}"
done

echo "All models downloaded."
