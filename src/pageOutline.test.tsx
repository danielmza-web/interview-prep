// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {PageOutline} from './PageOutline';
import {readingOffset} from './readingNavigation';
beforeEach(()=>{Element.prototype.scrollIntoView=()=>{};window.history.replaceState(null,'','#review-profile');});afterEach(cleanup);
it('indexes visible topics and questions, jumps with focus and leaves route and source content intact',async()=>{
 const html='<h2>Personal answers</h2><h3>Where do you see yourself in five years?</h3><p>My answer.</p><details><summary>Optional</summary><h3>Specific salary detail</h3></details>';
 render(<main id="reading"><PageOutline contentKey="profile" enabled/><div data-testid="content" dangerouslySetInnerHTML={{__html:html}}/></main>);
 const nav=await screen.findByRole('navigation',{name:'Page index'});
 expect(within(nav).queryByRole('link',{name:'Specific salary detail'})).toBeNull();
 fireEvent.click(within(nav).getByRole('link',{name:'Where do you see yourself in five years?'}));
 expect(document.activeElement?.tagName).toBe('H3');expect(location.hash).toBe('#review-profile');
 expect(within(nav).getByRole('link',{name:'Where do you see yourself in five years?'}).getAttribute('aria-current')).toBe('location');
 expect(screen.getByTestId('content').textContent).toContain('My answer.');expect(html).not.toContain('page-');
 const details=document.querySelector('details:not(.outline-mobile)')!;details.setAttribute('open','');fireEvent(details,new Event('toggle'));
 await within(nav).findByRole('link',{name:'Specific salary detail'});
});
it('groups two technical parts, keeps answers visible and uses the sticky return offset after a jump',async()=>{
 render(<><header className="topbar"/><main id="reading"><PageOutline contentKey="technical" enabled/><aside className="optional-return">Return</aside><section data-outline-part="Understand"><h2>Networks</h2><h3>Timeout flow</h3></section><section data-outline-part="Practise"><h2>Requests</h2><h3>What is a timeout?</h3><p>The full answer stays visible.</p></section><h2 data-outline-ignore>Administrative instruction</h2></main></>);
 document.querySelector('.topbar')!.getBoundingClientRect=()=>({bottom:65} as DOMRect);
 document.querySelector('.optional-return')!.getBoundingClientRect=()=>({height:50} as DOMRect);
 const nav=await screen.findByRole('navigation',{name:'Page index'});
 expect(within(nav).getByText('Understand')).toBeTruthy();expect(within(nav).getByText('Practise')).toBeTruthy();
 expect(within(nav).queryByRole('link',{name:'Administrative instruction'})).toBeNull();
 expect(screen.getByText('The full answer stays visible.').closest('details')).toBeNull();
 const headings=[...document.querySelectorAll<HTMLElement>('main>section h2,main>section h3')];
 headings.forEach((h,i)=>{h.getBoundingClientRect=()=>({top:i<2?-100:400} as DOMRect);});
 fireEvent.scroll(window);
 fireEvent.click(await within(nav).findByRole('button',{name:'Expand Requests'}));
 const destination=headings[3];destination.scrollIntoView=()=>{destination.getBoundingClientRect=()=>({top:readingOffset()} as DOMRect);headings[2].getBoundingClientRect=()=>({top:-20} as DOMRect);};
 fireEvent.click(within(nav).getByRole('link',{name:'What is a timeout?'}));fireEvent.scroll(window);
 await waitFor(()=>expect(within(nav).getByRole('link',{name:'What is a timeout?'}).getAttribute('aria-current')).toBe('location'));
 expect(document.activeElement).toBe(destination);expect(location.hash).toBe('#review-profile');
});
it('tracks reading position and rebuilds the index when the displayed content changes',async()=>{
 const view=render(<main id="reading"><PageOutline contentKey="one" enabled/><h2>Architecture</h2><h3>Mission acknowledgement</h3></main>);
 await screen.findByRole('navigation',{name:'Page index'});
 const h=[...document.querySelectorAll<HTMLElement>('main>h2,main>h3')];
 h[0].getBoundingClientRect=()=>({top:-200} as DOMRect);h[1].getBoundingClientRect=()=>({top:100} as DOMRect);fireEvent.scroll(window);
 await waitFor(()=>expect(within(screen.getByRole('navigation',{name:'Page index'})).getByRole('link',{name:'Mission acknowledgement'}).getAttribute('aria-current')).toBe('location'));
 view.rerender(<main id="reading"><PageOutline contentKey="two" enabled/><h2>Deployment</h2></main>);
 await within(screen.getByRole('navigation',{name:'Page index'})).findByRole('link',{name:'Deployment'});
 expect(within(screen.getByRole('navigation',{name:'Page index'})).queryByRole('link',{name:'Architecture'})).toBeNull();
 view.rerender(<main id="reading"><PageOutline contentKey="two" enabled={false}/><h2>Deployment</h2></main>);
 expect(screen.queryByRole('navigation',{name:'Page index'})).toBeNull();
});
