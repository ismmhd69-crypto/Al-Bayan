const b=require('../data/translations-claude/in.json');
for(const h of b)console.log('##',h.url.split(':')[2],h.need.join()==='en,de'?'':h.need.join(),'\n'+h.text_original.replace(/[ً-ْٰ]/g,'').replace(/‏/g,''))
