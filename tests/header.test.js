const puppeteer = require('puppeteer');
let browser, page;

//Every test runs this block before test block
beforeEach(async () => {
  // launch chromium browser
   browser = await puppeteer.launch({
    headless: false
  });
  //create new page/tab
   page = await browser.newPage();
  // go to our application at 3000
  await page.goto('localhost:3000');
});

//after each test
afterEach(async () =>{
  await browser.close();
});

test('Header Logo Text',async ()=> {

  //Use selector to get logo element
  const text = await page.$eval('a.brand-logo', el => el.innerHTML);

  //Assertion
  expect(text).toEqual('Emaily');

});

test('clicking login starts OAuth flow', async ()=> {
  // generate click
  await page.click('.right a');

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);

});

