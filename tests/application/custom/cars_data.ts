export type FictionalCarBrandModels = {
	brand: string;
	models: string[];
};

/**
 * Fictional car brands and models.
 *
 * Shape is optimized for UI pickers (brand dropdown -> model dropdown).
 */
export const FICTIONAL_CAR_BRANDS_MODELS: FictionalCarBrandModels[] = [
	{
		brand: 'Aether Motors',
		models: ['Nimbus S', 'Arcline GT', 'Vanta Touring', 'Quasar E'],
	},
	{
		brand: 'Borealis Automotive',
		models: ['Frostline', 'Aurora X', 'Polar Sprint', 'Midnight Wagon'],
	},
	{
		brand: 'Cinder & Co.',
		models: ['Ember Hatch', 'Sootrunner', 'Kiln Coupe', 'Ashvale'],
	},
	{
		brand: 'Driftstone',
		models: ['Cairn RL', 'Skylark R', 'Tidecut', 'Harborline'],
	},
	{
		brand: 'Eclipse Forge',
		models: ['Umbra RS', 'Solstice LX', 'Penumbra Sport', 'Helio Prime'],
	},
	{
		brand: 'Falconridge',
		models: ['Ridgeback', 'Kestrel S', 'Peregrine GT', 'Talonstrike'],
	},
	{
		brand: 'Granite Roads',
		models: ['Basalt 4', 'Obsidian Trail', 'Slate City', 'Marble Touring'],
	},
	{
		brand: 'Horizon Works',
		models: ['Daybreak', 'Sunline', 'Afterglow', 'Bluehour EV'],
	},
	{
		brand: 'Ironleaf',
		models: ['Sprig', 'Canopy', 'Barkline', 'Vinecross'],
	},
	{
		brand: 'Juniper Dynamics',
		models: ['Javelin', 'Crestwind', 'Trailjet', 'Sable'],
	},
	{
		brand: 'Kintsugi Auto',
		models: ['Gild', 'Seam', 'Lacquer', 'Restored GT'],
	},
	{
		brand: 'Lumina Mobility',
		models: ['Glow', 'Halation', 'Prism', 'Lumen One'],
	},
	{
		brand: 'Morrowline',
		models: ['Dawnshift', 'Eventide', 'Nocturne', 'Firstlight'],
	},
	{
		brand: 'Northstar Atelier',
		models: ['Compass', 'Polaris S', 'Meridian', 'Guidestar GT'],
	},
	{
		brand: 'Orchard Electric',
		models: ['Pippin', 'Cider', 'Bloom', 'Harvest R'],
	},
];

/**
 * Convenience: list of brands only.
 */
export const FICTIONAL_CAR_BRANDS: string[] = FICTIONAL_CAR_BRANDS_MODELS.map(
	(b) => b.brand,
);

/**
 * Convenience: map from brand -> models.
 */
export const FICTIONAL_CAR_MODELS_BY_BRAND: Record<string, string[]> =
	Object.fromEntries(FICTIONAL_CAR_BRANDS_MODELS.map((b) => [b.brand, b.models]));


export const ENGINE_TYPES = [
	{ value: 'gasoline', label: 'Gasoline' },
	{ value: 'diesel', label: 'Diesel' },
	{ value: 'electric', label: 'Electric' },
	{ value: 'hybrid', label: 'Hybrid' },
];

export const BODY_TYPES = [
	{ value: 'sedan', label: 'Sedan' },
	{ value: 'suv', label: 'SUV' },
	{ value: 'hatchback', label: 'Hatchback' },
	{ value: 'coupe', label: 'Coupe' },
	{ value: 'convertible', label: 'Convertible' },
	{ value: 'wagon', label: 'Wagon' },
	{ value: 'van', label: 'Van' },
	{ value: 'truck', label: 'Truck' },
];