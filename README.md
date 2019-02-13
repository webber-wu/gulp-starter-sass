#Gulp Example
--

###安裝說明

1. 安裝 node.js ([https://nodejs.org/en/](https://nodejs.org/en/))
2. 複製 package.json 至專案目錄最外層
3. 在專案目錄最外層安裝 node module `npm install`
4. 安裝完成

###檔案結構說明

project ┐

* dist/ (編譯完成檔) ┐

	* assets/ ┐

		* images/
		* css/
		* js/
	* index.html
	
* src / (開發檔) ┐

	* images/
	* js/
	* plugin/
	* postcss/
	* jade/
	* vendor/


* gulpfile.js
* README.md
* package.json (請移至最外層目錄安裝 modules)

###使用說明

1. 開啟終端機
2. 移動至專案資料夾
3. 輸入 `gulp build --dev` ( 開發模式 )
