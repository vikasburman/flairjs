Namespace('system.base');

Include('Hello: a.b.c.Hello');

Include('a.b.c.Hello').as('Hello');
Include('a.b.c.Hello').as('IDisposable');
Include('a.b.c.Hello').as('IAbc');
Include('a.b.c.Hello').as('Mix1');
Include('a.b.c.Hello').as('Something');

Gather((inc) => {
	Class('Vikas', Hello, [Mix1, IAbc, IDisposable], (a) => {
		
		a
		.private()
		.sealed();
		this.func('Test').as(() => {
			let st = new i.Something();
		});
		
		
		this.func('Test', () => {
		
		});

		this.func('Test', () => {

		});
		
		a(
		['readonly'],
        ['typeof', 'string']);
        this.prop('prop3', 200);

		a(
		['readonly'],
		['typeof', 'string']);
		this.prop('prop3',
		() => {

		},
		(value) => {

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

});


