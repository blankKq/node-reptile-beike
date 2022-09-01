// 加载https模块
var http = require('https');
// 然后提供像jquery一样的css选择器查询
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var fs = require('fs')

class Metro {

  constructor(url) {
    // this.url = url
    this.reg_haiwai = /\.com$/
  }

  getMetroData(url) {
    let _this = this
    this.getHtml(url).then(res => {
      if (res.code == 0) {
        let all_city_data = _this.filterProvince(res.msg) 
        _this.getCityData(all_city_data)
      } else {
        console.log('获取页面内容失败！')
      }
      
    })
  }

  /**
   * 功能: 根据url获取页面内容
   * @param {String} url 
   */
  getHtml(url) {

    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
  
        var datas = [];
        // 获取页面数据
        res.on('data', function (data) {
          datas.push(data);
        });
  
        // 数据获取结束
        res.on('end', () => {
          var chunk = iconv.decode(Buffer.concat(datas), 'utf-8');
          resolve({
            code: 0,
            msg: chunk
          })
        });
      }).on('error', function (e) {
        resolve({
          code: 1,
          msg: e
        })
      });
    })
    
  }

  /**
   * 功能: 获取省份数据
   * @param {String} html 
   */
  filterProvince(html) {
    if (html) {
      // 沿用JQuery风格，定义$
      var $ = cheerio.load(html);
      // 根据id列表信息
      // console.log($)
      var diypage = $('.city_list');

      let all_city_data = [];

      diypage.find('ul').each(function () {
        var ul = $(this);
        var list = [];

        ul.find('a').each(function () {
          list.push({
            city_href: $(this).attr('href'),
            city_name: $(this).text().trim()
          });
        });
        
        all_city_data.push(list)
        
      });

      return all_city_data
    } else {
      console.log('无数据传入！2');
    }
  }

  /**
   * 功能: 获取城市数据
   * @param {String} html 
   * @param {String} url 
   */
  filterCity(html, url) {
    if (html) {
      // 沿用JQuery风格，定义$
      var $ = cheerio.load(html);
      // 根据id列表信息
      // console.log($)
      var diypage = $('.m-filter div[data-role="ditiefang"] a');
  
      let area_data = [];
  
      diypage.each(function () {
        
        area_data.push({
          name: $(this).text().trim(),
          url: url + $(this).attr('href'),
        })
       
      });
  
      return area_data
      
    } else {
      console.log('无数据传入！3');
    }
  }

  /**
   * 功能: 获取其他特殊城市信息
   * @param {String} html 
   */
  filterOtherCity(html) {
    if (html) {
      // 沿用JQuery风格，定义$
      var $ = cheerio.load(html);
      // 根据id列表信息
      // console.log($)
      var diypage = $('.filter-by-area-container .district-item');
  
      let otherCity = [];
  
      diypage.each(function () {
        
        otherCity.push({
          loc1: $(this).text().trim(),
          loc2: [],
        })
       
      });
  
      return otherCity
      
    } else {
      console.log('无数据传入！3');
    }
  }

  /**
   * 功能: 获取区域数据
   * @param {String} html 
   */
  filterArea(html) {
    if (html) {
      // 沿用JQuery风格，定义$
      var $ = cheerio.load(html);
      // 根据id列表信息
      // console.log($)
      // var diypage = $('.m-filter .position dl:nth-child(2) dd > div > div:nth-child(2) a');
      var diypage = $('.m-filter div[data-role="ditiefang"] > div:nth-child(2) a');
  
      let area_data = [];
  
      diypage.each(function () {
        area_data.push($(this).text().trim())
        
      });
      return area_data
      
    } else {
      console.log('无数据传入！3');
    }
  }

  /**
   * 功能: 根据省份获取 所有城市信息
   * @param {Array} all_city_data 
   */
  async getCityData(all_city_data) {
    for (let i = 0, len = all_city_data.length; i < len; i++) {
      let item = all_city_data[i]
      for (let j = 0, len1 = item.length; j < len1; j++) {
        let ite = item[j]

        if (!this.reg_haiwai.test(ite.city_href)) { // 过滤海外城市
          continue
        }

        let city_html = await this.getHtml('https:' + ite.city_href + '/ershoufang/')
        if (city_html.code == 0) {
          let city_data = this.filterCity(city_html.msg, 'https:' + ite.city_href)
          if (city_data.length > 0) {
            let area_data = await this.getAreaData(city_data)
            console.log(ite.city_name)
            this.writeFile('./all_city_data/metro/'+ite.city_name+'.json', area_data)
          } 
          // else {
          //   let other_city_html = await this.getHtml('https:' + ite.city_href + '/loupan/')
          //   let otherCity = this.filterOtherCity(other_city_html.msg)
          //   this.writeFile('./all_city_data/area/'+ite.city_name+'.json', otherCity)
          // }
          
        } else {
          console.log('城市页面数据获取失败')
        }
      }
    }
  }

  /**
   * 功能: 根据城市，获取区域信息
   * @param {Array} city_data 
   */
  async getAreaData(city_data) {
    let arr = []
    for (let i = 0, len = city_data.length; i < len; i ++) {
      let item = city_data[i]
      let area_html = await this.getHtml(item.url)
      if (area_html.code == 0) {
        let area_list = this.filterArea(area_html.msg)
        arr.push({
          loc1: item.name,
          loc2: area_list
        })
        
      } else {
        console.log('12')
      }
    }
    return arr
  }

  /**
   * 功能: 写入文件
   * @param {String} fileName 
   * @param {Array} data 
   */
  writeFile(fileName, data) {
    // './all_city_data/'+fileName+'.json'
    fs.writeFileSync(fileName, JSON.stringify(data), function (error) {
      if (error) {
        console.log('写入失败')
      } else {
        console.log('写入成功了')
      }
    })
  }


}

module.exports = Metro;