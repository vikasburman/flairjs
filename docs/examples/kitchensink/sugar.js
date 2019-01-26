Namespace('system.base');

Include('a.b.c.Hello').as('Hello');
Include('a.b.c.Hello').as('IDisposable');
Include('a.b.c.Hello').as('IAbc');
Include('a.b.c.Hello').as('Mix1');
Include('a.b.c.Hello').as('Something');

Class('Vikas').ex('Hello').mx('Mix1').impl('IDisposable', 'IAbc').as((a, i) => {
    a
    .public()
	.sealed();
	this.func('Test').as(() => {
		let st = new i.Something();
	});
	
	this.func('Test', () => {
	
	});
	
	private.function('Name').as((aa) => {
	
	});
	
	a
	.sealed()
	.readonly();
	protected.property('cc').value(10);

	pro.prop('capacity')
		.set(() => {
	
		})
		.get((value) => {
	
		});
		
	pub.event('started')
	
	pri.async.func('Name').as((resolve, reject) => {
	
	})
	
	pro.override.func('Test').as((base) => {
		
	});

});
