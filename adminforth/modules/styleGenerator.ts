import { transformObject,deepMerge,createRGBA,parseColorForAliases,darkenRGBA, lightenRGBA, inverseRGBA } from "./utils.js";
import { styles } from "./styles.js";


export class StylesGenerator {
    styleConfig: any;
    defaultStyles: any;
  
    constructor(styleConfig: any) {
     
      this.styleConfig = styleConfig;
      this.defaultStyles = styles();
    }
  
    private generatePlainStyles(styleObj:any) {
      let plainCustomStyles = {}
      if (styleObj) {
        Object.keys(styleObj).forEach((k)=>{
          plainCustomStyles[k] = transformObject(styleObj[k])
        })
      }
      return plainCustomStyles;
    }
   
    private changeAlias(str:any, mergedStyles:any){
      const {aliasMatch,opacityMatch,darkenMatch,lightenMatch, inverseMatch} = parseColorForAliases(str);
      if (!aliasMatch) {
        return str;
      } else {
        const alias = aliasMatch[1];
        let opacity = opacityMatch ? parseFloat(opacityMatch[1]) : 1;
        const color = mergedStyles[alias];
        if (darkenMatch) {
          return darkenRGBA(createRGBA(color, opacity))
        }
        if (lightenMatch){
          return lightenRGBA(createRGBA(color, opacity))
        }
        if (inverseMatch){
          return inverseRGBA(createRGBA(color, opacity))
        }
        return createRGBA(color, opacity);
      }
    }  
  
    mergeStyles() {
      let mergedStyles = deepMerge(this.defaultStyles, this.generatePlainStyles(this.styleConfig));
      let colors = mergedStyles.colors;
      Object.entries(colors).forEach(([key,value])=>{

        colors[key] =  this.changeAlias(value,colors)
      })
      return mergedStyles;
    }
  }