import carsResourseTemplate from "./carsResourseTemplate.js";
import ForeignInlineListPlugin from '../../../plugins/adminforth-foreign-inline-list/index.js';

const carsResource = carsResourseTemplate("cars_sl", "sqlite", "id");
carsResource.plugins!.push(new ForeignInlineListPlugin({ foreignResourceId: 'car_meta' }));

export default carsResource;
