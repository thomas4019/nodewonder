Node Wonder
===
## Getting Started
1. Install [Node and NPM](http://nodejs.org/download/)
2. Within project run "npm install"
3. Ensure bower is installed by running "sudo npm install -g bower"
4. Run "bower install jquery#1.10" (this is needed because otherwise bower cannot decide which version of jQuery to use)
5. Run "node server.js"
6. Visit [http://localhost:3000](http://localhost:3000)
7. When debugging and programming using nodemon (from npm is useful)

## Resources
1. [Summary Document](https://docs.google.com/document/d/1P1b4pfQa47nQUJXY59b_krdVow_mTHNrgHb6wNWI1Tg)
2. [Technical Details (Widgets)](https://docs.google.com/document/d/1LL-SGv9wvnWPT5aZLaNGSyzU45xC27R1-6Fz67FupAo)

## Key Principles
1. Create advanced websites without code via Widgets
2. Everything is Widgets
3. Widgets are Open-Source, Reusable, and Sandboxed
4. File-based configuration based on url

## Todo
* Moving widgets from zone to zone
* Sorting widgets
* Create a "model" stored in the file system
* Create a "model" stored in MongoDB
* Fields cleanup (remove "fields" dependency)
* Fix fillValues function to support deeper values
* Multi-valued fields
* Heirarchical fields
* Composition of fields
* Internal library functions
* CSS/JS Aggregation

## Unsure
* Models backed by SQL?
