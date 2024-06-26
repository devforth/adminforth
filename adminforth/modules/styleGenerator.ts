import { transformObject,deepMerge } from "./utils.js";
import { styles } from "./styles.js";

const aliasObject ={ lightSidebarText:'lightSidebarIcons',darkSidebarText:'darkSidebarIcons',lightSidebarTextHover:'lightSidebarIconsHover',darkSidebarTextHover:'darkSidebarIconsHover'}

export class StylesGenerator {
    styleConfig: any;
    defaultStyles: any;
  
    constructor(styleConfig: any) {
      if (!styleConfig) {
        console.log("No styles provided using default styles.");
      }
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
    private changeAliases(plateStyles: any) {
      if (!plateStyles || !plateStyles.colors) {
        return plateStyles;
      }
      let colors = plateStyles.colors;
      Object.keys(aliasObject).forEach((aliasName) => {
        if (colors[aliasObject[aliasName]]) return;
        if (!colors[aliasName]) return;
        colors[aliasObject[aliasName]] = colors[aliasName];
      })
      return plateStyles;
    }
  
    mergeStyles() {
      let mergedStyles = deepMerge(this.defaultStyles, this.changeAliases(this.generatePlainStyles(this.styleConfig)));
      return mergedStyles;
    }
  
  }