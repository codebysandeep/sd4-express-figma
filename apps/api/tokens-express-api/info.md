Current project:
NX workspace

Tokens
 
 I am working with design system tokens by using styledictionary version 4. I have all generated tokens in build folder by defined platform folders name like: android, ios, and web. In this question I am refering web folder but I want one solution which control all anroid, ios and web.

 Question:
 I want a API soltuion for sharing these build folder brands and their formats as end point for the developers. For this I planned to use expressjs. 

 In nx workspace I create a project under apps/api/tokens-express-api and want to implement all express releated code, but all tokens are available under packages/tokens/build/web/global. Kindly suggest a enterprise application based express soltuion for providing api endpoint for developers. One more I have plan to use AWS for api deployment. Is aws is good idea for publish API? If yes then suggest a good soltuion with help express and aws to make things happen.

For 
brand-a: 
build/web/global/brand-a/css/brand-a-color.css 
build/web/global/brand-a/js/brand-a-color.js 
build/web/global/brand-a/json/brand-a-color.json 
build/web/global/brand-a/scss/brand-a-color.scss

For brand-b: 
build/web/global/brand-b/css/brand-b-color.css 
build/web/global/brand-b/js/brand-b-color.js 
build/web/global/brand-b/json/brand-b-color.json 
build/web/global/brand-b/scss/brand-b-color.scss

For brand-a-theme: 
build/web/global/brand-a-theme/css/brand-a-theme-color.css
build/web/global/brand-a-theme/js/brand-a-theme-color.js 
build/web/global/brand-a-theme/json/brand-a-theme-color.json 
build/web/global/brand-a-theme/scss/brand-a-theme-color.scss

For brand-b-theme: 
build/web/global/brand-b-theme/css/brand-b-theme-color.css 
build/web/global/brand-b-theme/js/brand-b-theme-color.js 
build/web/global/brand-b-theme/json/brand-b-theme-color.json 
build/web/global/brand-b-theme/scss/brand-b-theme-color.scss