const puppeteer = require( 'puppeteer' );

( async() => {

	const browser = await puppeteer.launch({ignoreHTTPSErrors: true, acceptInsecureCerts: true, args: ['--proxy-bypass-list=*', '--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-first-run', '--no-sandbox', '--no-zygote', '--single-process', '--ignore-certificate-errors', '--ignore-certificate-errors-spki-list', '--enable-features=NetworkService']});
	const page = await browser.newPage();
	await page.goto( 'https://friendospredator.com/webclient/index.html' );
	
	await page.waitForFunction("document.getElementsByTagName( 'iframe' ).length > 0" ); 
	
	const frames = await page.frames();
	const loginFrame = frames.find( f => f.url().indexOf( 'loginprompt' ) > 0 );
	
	const n = await loginFrame.$("#Username");
	n.click();
	n.type( '{username}' );
	await page.waitForTimeout( 100 );
	
	const p = await loginFrame.$("#Password");
	p.click();
	p.type( '{password}' );
	await page.waitForTimeout( 100 );
	
	const b = await loginFrame.$("#loginButton");
	b.click();
	
	const test = await page.$(".Login");
	test.click();
	
	console.log( 'OK' );
	
	const tesot = await page.$("#Login");
	console.log( tesot );
	
	let currentUrl;
	
	let iter = 0;
	let running = true;
	while( running )
	{
		await page.waitForTimeout( 500 );
		await page.evaluate( 'document.body.className' )
			.then( async ( e ) => {
				console.log( 'We got ' + e + ' iframes' );
				if( e.indexOf( 'Activating' ) < 0 )
				{
					console.log( 'Done', e );
					await page.waitForTimeout( 500 );
					running = false;
				}
			} );
		
	}
	await page.screenshot({path: 'LR.png'});
	await browser.close();
	
	console.log( 'YES' );
	
	
} )();
