// @vitest-environment jsdom
import {Suspense,lazy} from 'react';
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
const Editor=lazy(()=>import('./Editor').then(m=>({default:m.Editor})));
afterEach(cleanup);
it('opens multiple lazy editors and refreshes saved content without emitting an edit',async()=>{
 const changed=vi.fn();
 const fields=(summary:string)=><>{['Section content','Suggested answer','Print summary'].map(label=><Suspense key={label} fallback={<p>Loading {label}</p>}><Editor label={label} value={'<p>'+summary+' '+label+'</p>'} onChange={changed}/></Suspense>)}</>;
 const view=render(fields('Original'));
 for(const label of ['Section content','Suggested answer','Print summary'])expect(await screen.findByRole('textbox',{name:label},{timeout:5000})).toBeTruthy();
 view.rerender(fields('Saved revision'));
 expect(await screen.findByText('Saved revision Print summary')).toBeTruthy();
 expect(changed).not.toHaveBeenCalled();
});
