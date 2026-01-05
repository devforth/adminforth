CREATE TABLE IF NOT EXISTS cars (
  id String,

  model String,
  price Float64,

  created_at DateTime DEFAULT now(),

  engine_type Nullable(String),
  engine_power Nullable(Int32),
  production_year Nullable(Int32),

  description Nullable(String),
  listed Bool DEFAULT false,

  mileage Nullable(Float64),
  color Nullable(String),
  body_type Nullable(String),

  photos Nullable(String),

  seller_id Nullable(String),
  seller Nullable(String),

  promo_picture Nullable(String),
  generated_promo_picture Nullable(String)
)

ENGINE = MergeTree
ORDER BY tuple();