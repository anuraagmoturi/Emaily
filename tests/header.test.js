
const Page = require('./helpers/page');

let page;

//Every test runs this block before test block
beforeEach(async () => {
  page = await Page.build();
  await page.goto('http://localhost:3000');
});

//after each test
afterEach(async () =>{
  await page.close();
});

test('Header Logo Text',async ()=> {

  //Use selector to get logo element
 // const text = await page.$eval('a.brand-logo', el => el.innerHTML);
  const text = await page.getContentsOf('a.brand-logo');

  //Assertion
  expect(text).toEqual('Emaily');

});

test('clicking login starts OAuth flow', async ()=> {
  // generate click
  await page.click('.right a');

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);

});

test('When signed in, shows logout button', async() => {

  await page.login();

  const text = await page.getContentsOf('a[href="/api/logout"]');

  expect(text).toEqual('Logout');

});

