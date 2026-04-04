CREATE TABLE IF NOT EXISTS adminuserCars (
  id String,
  adminuserId String,
  carId String
)
ENGINE = MergeTree
ORDER BY tuple();