DO_N_TIME=10

for i in $(seq 1 $DO_N_TIME)
do
  # curl https://api.openai.com/v1/images/generations \
  #   -H "Content-Type: application/json" \
  #   -H "Authorization: Bearer $OPENAI_TOKEN" \
  #   -d '{
  #     "model": "dall-e-3",
  #     "prompt": "A photorealistic image of a cute kitty lying on top of a database symbol. Kitty should have eyes open. The database should be represented as a cylindrical shape, and the kitty should look relaxed and content, possibly curled up or stretched out.",
  #     "n": 1,
  #     "size": "1024x1024"
  #   }'

  curl https://api.openai.com/v1/images/generations \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_TOKEN" \
    -d '{
      "model": "dall-e-3",
      "prompt": "A photorealistic image of a cute kitty playing with nice rectangle box. Box is rounded and has CSS on it. The kitty should look playful and curious",
      "n": 1,
      "size": "1024x1024"
    }'
done