
const DBKEY='smartWholesaleDB';
let db=JSON.parse(localStorage.getItem(DBKEY)||'{"products":[],"companies":[],"transactions":[],"customers":[],"suppliers":[],"employees":[],"recoveries":[],"expenses":[],"settings":{}}');
const save=()=>localStorage.setItem(DBKEY,JSON.stringify(db));
function showPage(id){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));renderAll()}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function val(id){return document.getElementById(id).value.trim()}
function companyNames(){return [...new Set([...(db.companies||[]).map(c=>c.name),...(db.products||[]).map(p=>p.company),...(db.suppliers||[]).map(x=>x.company),...(db.transactions||[]).map(t=>t.company)].map(x=>(x||'').trim()).filter(Boolean))]}
function ensureCompanyEntry(name,stock,cost,paid=0,source='Manual Entry'){
 if(!name)return;db.companies=db.companies||[];db.companies.push({id:Date.now()+Math.random(),name,stock:+stock||0,cost:+cost||0,paid:+paid||0,source,date:new Date().toISOString()});
}
function addProduct(){
 const p={id:Date.now(),name:val('pName'),company:val('pCompany'),supplier:val('pSupplier'),category:val('pCategory'),type:val('pType'),size:val('pSize'),carton:+val('pCarton')||144,box:+val('pBox')||12,pieces:+val('pPieces')||0,cost:+val('pCost')||0,sale:+val('pSale')||0,status:val('pStatus')};
 if(!p.name){alert('Product name required');return} db.products.push(p);if(p.company&&p.pieces>0)ensureCompanyEntry(p.company,p.pieces,p.pieces*p.cost,0,'Inventory Finalized');save();clearProductForm();renderAll();alert('Product saved. Initial stock cost was added to Company Khata if company and pieces were entered.');
}
function clearProductForm(){['pName','pCompany','pSupplier','pCategory','pType','pSize','pPieces','pCost','pSale'].forEach(id=>document.getElementById(id).value='')}
function renderProducts(){
 const q=val('inventorySearch').toLowerCase();let rows=db.products.filter(p=>Object.values(p).join(' ').toLowerCase().includes(q));
 productTable.innerHTML=rows.length?rows.map(p=>`<tr><td>${p.name}</td><td>${p.company||''}</td><td>${p.supplier||''}</td><td>${p.category||''}</td><td>${p.size||''}</td><td>${p.pieces||0}</td><td>${p.cost||0}</td><td>${p.sale||0}</td><td><span class="badge">${p.status||'Active'}</span></td><td><button class="btn red" onclick="deleteProduct(${p.id})">Delete</button></td></tr>`).join(''):'<tr><td colspan="10" class="empty">No products found</td></tr>';
}
function deleteProduct(id){if(confirm('Delete product?')){db.products=db.products.filter(p=>p.id!==id);save();renderAll()}}
function selectPurchaseProduct(){const p=db.products.find(x=>x.name===val('buyProduct'));if(!p)return;if(!val('buyCompany')&&p.company)document.getElementById('buyCompany').value=p.company;document.getElementById('buyCost').value=p.cost||0;previewPurchaseTotal()}
function selectSaleProduct(){const p=db.products.find(x=>x.name===val('saleProduct'));if(p){document.getElementById('salePrice').value=p.sale||0}}
function previewPurchaseTotal(){document.getElementById('buyTotal').value=((+val('buyPieces')||0)*(+val('buyCost')||0)).toFixed(2)}
function filterPurchaseProducts(){const q=val('buySearch').toLowerCase(),el=document.getElementById('buyProduct'),old=el.value;const rows=db.products.filter(p=>`${p.name} ${p.company||''} ${p.category||''}`.toLowerCase().includes(q));el.innerHTML='<option value="">Select product</option>'+rows.map(p=>`<option value="${String(p.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}">${p.name}${p.company?' — '+p.company:''}</option>`).join('');if(rows.some(p=>p.name===old))el.value=old;selectPurchaseProduct()}
function renderPurchaseList(){const q=(document.getElementById('purchaseListSearch')?.value||'').toLowerCase();const rows=db.products.filter(p=>`${p.name} ${p.company||''} ${p.category||''}`.toLowerCase().includes(q));document.getElementById('purchaseProductList').innerHTML=rows.length?`<table><thead><tr><th>Product</th><th>Company</th><th>Pieces</th><th>Cost Price</th><th>TP Rate</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${p.name}</td><td>${p.company||''}</td><td>${p.pieces||0}</td><td>${p.cost||0}</td><td>${p.sale||0}</td></tr>`).join('')}</tbody></table>`:'No products found'}
function saveTransaction(type){
 let details='',amount=0,extra={};
 if(type==='Purchase'){
  const company=val('buyCompany'),productName=val('buyProduct'),pieces=+val('buyPieces')||0,cost=+val('buyCost')||0;
  if(!company){alert('Please enter/select company name');return}if(!productName){alert('Please select a saved product');return}if(pieces<=0){alert('Please enter pieces greater than zero');return}
  const product=db.products.find(p=>p.name===productName);if(!product){alert('Product not found. Save it in Inventory first.');return}
  amount=pieces*cost;details=`Company: ${company}, Supplier: ${val('buySupplier')}, Product: ${productName}, Pieces: ${pieces}, Unit Cost: ${cost}, Total Cost: ${amount}`;extra={company,product:productName,pieces,unitCost:cost,supplier:val('buySupplier')};product.pieces=(+product.pieces||0)+pieces;product.cost=cost;product.company=company;ensureCompanyEntry(company,pieces,amount,0,'Purchase Finalized');
 }
 if(type==='Sale'){const customer=val('saleCustomer'),productName=val('saleProduct'),pieces=+val('salePieces')||0,rate=+val('salePrice')||0,d=+val('saleDiscount')||0;const prod=db.products.find(p=>p.name===productName);if(!customer){alert('Please select a customer');return}if(!prod){alert('Please select a saved product');return}if(pieces<=0){alert('Please enter pieces greater than zero');return}if(pieces>(+prod.pieces||0)){if(!confirm('Sale quantity is greater than current stock. Continue anyway?'))return}if(d<0||d>100){alert('Discount must be between 0 and 100 percent');return}const gross=pieces*rate;amount=gross-(gross*d/100);details=`Customer: ${customer}, Product: ${productName}, Pieces: ${pieces}, Salesman: ${val('saleSalesman')}, Area: ${val('saleArea')}, Discount: ${d}%`;extra={customer,product:productName,pieces,salePrice:rate,rate,salesman:val('saleSalesman'),area:val('saleArea'),billNo:'SI-'+Date.now().toString().slice(-8)};prod.pieces=(+prod.pieces||0)-pieces;}
 if(type==='Sale Return'){details=`Customer: ${val('retCustomer')}, Product: ${val('retProduct')}, Pieces: ${val('retPieces')}, Reason: ${val('retReason')}`;extra={customer:val('retCustomer'),product:val('retProduct'),pieces:+val('retPieces')||0};const prod=db.products.find(p=>p.name===val('retProduct'));if(prod)prod.pieces=(+prod.pieces||0)+(+val('retPieces')||0)}
 db.transactions.push({date:new Date().toISOString(),type,details,amount,...extra});save();renderAll();if(type==='Purchase'){['buyCompany','buySupplier','buySearch','buyPieces'].forEach(id=>document.getElementById(id).value='');document.getElementById('buyProduct').value='';document.getElementById('buyCost').value='';previewPurchaseTotal()}alert(type+' saved. Stock and Company Khata updated where applicable.')}
function saveCompany(){const name=val('companyName');if(!name){alert('Company name required');return}ensureCompanyEntry(name,+val('companyStock')||0,+val('companyCost')||0,+val('companyPayment')||0,'Manual Entry');save();renderAll();alert('Company entry saved')}
function saveSimple(type){
 const map={customers:['custName','custPhone','custArea','custDue'],suppliers:['supName','supPhone','supCompany','supDue'],employees:['empName','empRole','empSalary','empPhone']};
 let o={};map[type].forEach(id=>o[id.replace(/^(cust|sup|emp)/,'').toLowerCase()]=val(id));db[type].push(o);save();renderAll()}
function saveRecovery(){const customer=val('recCustomer'),amount=+val('recAmount')||0;if(!customer){alert('Please select a customer');return}if(amount<0){alert('Payment cannot be negative');return}db.recoveries.push({customer,person:val('recPerson'),amount,date:val('recDate')||new Date().toISOString().slice(0,10)});save();renderAll();updateRecoveryInfo();document.getElementById('recAmount').value='';alert('Payment saved. Extra payment is allowed and will be shown in the ledger.')}
function saveExpense(){db.expenses.push({name:val('expName'),amount:+val('expAmount')||0,category:val('expCategory'),date:val('expDate')});save();renderAll()}
function saveSettings(){db.settings={...(db.settings||{}),shopName:val('shopName'),city:val('shopCity'),area:val('shopArea'),areas:val('areaOptions').split(',').map(x=>x.trim()).filter(Boolean),booker:val('booker'),salesman:val('salesman'),collector:val('collector')};save();renderAll();alert('Settings saved')}
function generateReport(){let t=val('reportType');let out='';if(t==='Stock Report')out=db.products.map(p=>`${p.name} — ${p.pieces} pcs — Cost ${p.cost} — Sale ${p.sale}`).join('<br>')||'No stock data';else if(t==='Sales Report')out=db.transactions.filter(x=>x.type==='Sale').map(x=>`${x.date.slice(0,10)} — ${x.details} — ${x.amount}`).join('<br>')||'No sales';else if(t==='Purchase Report')out=db.transactions.filter(x=>x.type==='Purchase').map(x=>`${x.date.slice(0,10)} — ${x.details} — ${x.amount}`).join('<br>')||'No purchases';else if(t==='Recovery Report')out=db.recoveries.map(x=>`${x.date} — ${x.customer} — ${x.person} — ${x.amount}`).join('<br>')||'No recovery';else if(t==='Profit Report'){let s=db.transactions.filter(x=>x.type==='Sale').reduce((a,x)=>a+x.amount,0),p=db.transactions.filter(x=>x.type==='Purchase').reduce((a,x)=>a+x.amount,0),e=db.expenses.reduce((a,x)=>a+x.amount,0);out=`Sales: ${s}<br>Purchases: ${p}<br>Expenses: ${e}<br><b>Approx. Profit: ${s-p-e}</b>`}else out='Warehouse / stock difference report: use product current pieces and transaction records for reconciliation.';reportOutput.innerHTML=out}
function transactionCustomer(t){if(t.customer)return t.customer;const m=(t.details||'').match(/Customer:\s*([^,]+)/i);return m?m[1].trim():''}
function customerBills(name){return db.transactions.filter(t=>t.type==='Sale'&&transactionCustomer(t)===name).reduce((a,t)=>a+(+t.amount||0),0)}
function customerPayments(name){return db.recoveries.filter(r=>r.customer===name).reduce((a,r)=>a+(+r.amount||0),0)}
function customerPending(name){const c=db.customers.find(x=>x.name===name);return ((+c?.due||0)+customerBills(name))-customerPayments(name)}
function fillSelect(id,values,placeholder){const el=document.getElementById(id);if(!el)return;const old=el.value;const unique=[...new Set(values.map(v=>(v||'').trim()).filter(Boolean))];el.innerHTML=`<option value="">${placeholder}</option>`+unique.map(v=>`<option value="${String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}">${v}</option>`).join('');if(unique.includes(old))el.value=old}
function updateRecoveryInfo(){const name=val('recCustomer');if(!name){['recBilled','recPaid','recPending','recEntered'].forEach(id=>document.getElementById(id).textContent='PKR 0');recoveryLedger.innerHTML='Select a customer to view bills and payments.';return}const billed=customerBills(name),paid=customerPayments(name),c=db.customers.find(x=>x.name===name),opening=+c?.due||0,pending=opening+billed-paid;recBilled.textContent='PKR '+(opening+billed).toLocaleString();recPaid.textContent='PKR '+paid.toLocaleString();recPending.textContent='PKR '+pending.toLocaleString();recEntered.textContent='PKR '+((+val('recAmount')||0)).toLocaleString();const bills=db.transactions.filter(t=>t.type==='Sale'&&transactionCustomer(t)===name).map(t=>`<tr><td>${(t.date||'').slice(0,10)}</td><td>Bill</td><td>PKR ${(+t.amount||0).toLocaleString()}</td><td>${t.details||''}</td></tr>`).join('');const payments=db.recoveries.filter(r=>r.customer===name).map(r=>`<tr><td>${r.date||''}</td><td>Payment received</td><td>PKR ${(+r.amount||0).toLocaleString()}</td><td>${r.person||''}</td></tr>`).join('');recoveryLedger=`<p><b>Current balance:</b> PKR ${pending.toLocaleString()} — negative balance means extra payment/credit.</p><table><thead><tr><th>Date</th><th>Entry</th><th>Amount</th><th>Details / Person</th></tr></thead><tbody>${bills}${payments}</tbody></table>`}
function uniqueNames(arr){return [...new Set((arr||[]).map(x=>(x||'').toString().trim()).filter(Boolean))]}
function supplierNames(){return uniqueNames([...(db.suppliers||[]).map(x=>x.name),...(db.products||[]).map(x=>x.supplier),...(db.transactions||[]).map(x=>x.supplier)])}
function customerNames(){return uniqueNames([...(db.customers||[]).map(x=>x.name),...(db.transactions||[]).map(x=>x.customer),...(db.recoveries||[]).map(x=>x.customer)])}
function salesmanNames(){return uniqueNames([db.settings?.salesman,db.settings?.collector,...(db.employees||[]).filter(e=>/sales/i.test(e.role||'')).map(e=>e.name),...(db.employees||[]).map(e=>e.name),...(db.transactions||[]).map(t=>t.salesman),...(db.recoveries||[]).map(r=>r.person)])}
function fillSelectKeep(id,items,placeholder){const el=document.getElementById(id);if(!el)return;const old=el.value;fillSelect(id,uniqueNames(items),placeholder);if([...el.options].some(o=>o.value===old))el.value=old}
function renderAll(){
 const names=companyNames();
 fillSelectKeep('pCompany',names,'Select company');
 fillSelectKeep('buyCompany',names,'Select company');
 fillSelectKeep('companyName',names,'Select company');
 fillSelectKeep('pSupplier',supplierNames(),'Select supplier');
 fillSelectKeep('buySupplier',supplierNames(),'Select supplier');
 fillSelectKeep('saleCustomer',customerNames(),'Select customer');
 fillSelectKeep('retCustomer',customerNames(),'Select customer');
 fillSelectKeep('recCustomer',customerNames(),'Select customer');
 fillSelectKeep('saleSalesman',salesmanNames(),'Select salesman');
 fillSelectKeep('recPerson',salesmanNames(),'Select salesman / recovery person');
 fillSelect('saleProduct',db.products.map(p=>p.name),'Select product');filterPurchaseProducts();renderPurchaseList();
 fillSelect('custArea',[...(db.settings?.areas||[]),db.settings?.area,...db.customers.map(c=>c.area),...db.transactions.map(t=>t.area)],'Select area');
 fillSelect('saleArea',[...(db.settings?.areas||[]),db.settings?.area,...db.customers.map(c=>c.area)],'Select area');
 countProducts.textContent=db.products.length;countPieces.textContent=db.products.reduce((a,p)=>a+(+p.pieces||0),0);
 let sales=db.transactions.filter(x=>x.type==='Sale'&&x.date.slice(0,10)===new Date().toISOString().slice(0,10)).reduce((a,x)=>a+x.amount,0);todaySales.textContent='PKR '+sales.toLocaleString();
 outstanding.textContent='PKR '+db.customers.reduce((a,c)=>a+(+c.due||0),0).toLocaleString();
 renderProducts();renderPreviousBills();const companyTotals={};(db.companies||[]).forEach(c=>{if(!c.name)return;const k=c.name;companyTotals[k]=companyTotals[k]||{stock:0,cost:0,paid:0};companyTotals[k].stock+=(+c.stock||0);companyTotals[k].cost+=(+c.cost||0);companyTotals[k].paid+=(+c.paid||0)});companyTable.innerHTML=Object.entries(companyTotals).map(([n,c])=>`<tr><td>${n}</td><td>${c.stock}</td><td>${c.cost.toLocaleString()}</td><td>${c.paid.toLocaleString()}</td><td>${(c.cost-c.paid).toLocaleString()}</td></tr>`).join('');
 transactionTable.innerHTML=db.transactions.slice().reverse().map(x=>`<tr><td>${x.date.replace('T',' ').slice(0,19)}</td><td>${x.type}</td><td>${x.details}</td><td>${x.amount}</td></tr>`).join('');
 customerList.innerHTML=db.customers.length?db.customers.map(x=>`${x.name||''} — ${x.phone||''} — Area: ${x.area||''} — Balance: ${customerPending(x.name||'')}`).join('<br>'):'No customers yet.';
 supplierList.innerHTML=db.suppliers.length?db.suppliers.map(x=>`${x.name||''} — ${x.phone||''} — ${x.company||''}`).join('<br>'):'No suppliers yet.';
 employeeList.innerHTML=db.employees.length?db.employees.map(x=>`${x.name||''} — ${x.role||''} — Salary: ${x.salary||0}`).join('<br>'):'No employees yet.';
 if(document.getElementById('areaOptions'))document.getElementById('areaOptions').value=(db.settings?.areas||[]).join(', ');if(document.getElementById('shopName')){shopName.value=db.settings?.shopName||'Smart Wholesale';shopCity.value=db.settings?.city||'';shopArea.value=db.settings?.area||'';booker.value=db.settings?.booker||'';salesman.value=db.settings?.salesman||'';collector.value=db.settings?.collector||''}updateRecoveryInfo();
}
function printSaleBill(){
 const customer=val('saleCustomer'), salesmanName=val('saleSalesman'), area=val('saleArea'), productName=val('saleProduct');
 const pieces=+val('salePieces')||0, rate=+val('salePrice')||0, discount=+val('saleDiscount')||0;
 if(!customer){alert('Please select a customer before printing the bill.');return}
 if(!productName){alert('Please select a product before printing the bill.');return}
 if(pieces<=0){alert('Please enter pieces greater than zero.');return}
 const gross=pieces*rate, discountAmount=gross*discount/100, net=gross-discountAmount;
 const shop=(db.settings&&db.settings.shopName)||'Smart Wholesale';
 const city=(db.settings&&db.settings.city)||'', shopArea=(db.settings&&db.settings.area)||'';
 const latest=db.transactions.filter(t=>t.type==='Sale'&&transactionCustomer(t)===customer&&t.product===productName&&(+t.pieces||0)===pieces).slice(-1)[0];
 const billNo=latest&&latest.billNo?latest.billNo:('SI-'+new Date().getTime().toString().slice(-8));
 const date=new Date().toLocaleDateString();
 const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 document.getElementById('printArea').innerHTML=`<div class="invoice"><h1>${esc(shop)}</h1><p style="text-align:center">${esc([city,shopArea].filter(Boolean).join(' • '))}</p><h2 style="text-align:center;margin-top:18px">SALE INVOICE</h2><div class="meta"><div><b>Bill No:</b> ${esc(billNo)}<br><b>Date:</b> ${esc(date)}</div><div><b>Customer:</b> ${esc(customer)}<br><b>Area:</b> ${esc(area||'-')}<br><b>Salesman:</b> ${esc(salesmanName||'-')}</div></div><table><thead><tr><th>Sr.</th><th>Product</th><th>Pieces</th><th>Rate (PKR)</th><th>Amount (PKR)</th></tr></thead><tbody><tr><td>1</td><td>${esc(productName)}</td><td>${pieces}</td><td>${rate.toLocaleString()}</td><td>${gross.toLocaleString()}</td></tr></tbody></table><div class="total"><div><span>Gross Total</span><b>PKR ${gross.toLocaleString()}</b></div><div><span>Discount (${discount}%)</span><b>PKR ${discountAmount.toLocaleString()}</b></div><div style="border-top:2px solid #111;font-size:18px"><span><b>Net Payable</b></span><b>PKR ${net.toLocaleString()}</b></div></div><div class="bill-terms"><b>اہم نوٹ / IMPORTANT NOTICE</b><p>مال کے معیار، کمی یا کٹوتی کے حوالے سے کوئی کلیم قابلِ قبول نہیں ہوگا۔</p><p>سیلز مین کے ساتھ ہونے والا کھاتہ اور لین دین خریدار اور سیلز مین کی باہمی ذمہ داری ہے؛ اس معاملے میں کمپنی ذمہ دار نہیں ہوگی۔</p></div><p class="thanks">Thank you for your business.</p></div>`;
 window.print();
}
function renderPreviousBills(){
 const q=(document.getElementById('previousBillSearch')?.value||'').toLowerCase();
 const sales=db.transactions.map((t,i)=>({...t,_idx:i})).filter(t=>t.type==='Sale').reverse().filter(t=>`${t.billNo||''} ${transactionCustomer(t)} ${t.product||''} ${t.details||''} ${t.date||''}`.toLowerCase().includes(q));
 const select=document.getElementById('previousBillSelect'),old=select.value;
 select.innerHTML='<option value="">Select previous bill</option>'+sales.map(t=>`<option value="${t._idx}">${t.billNo||('Sale '+(t._idx+1))} — ${transactionCustomer(t)||'Customer'} — PKR ${(+t.amount||0).toLocaleString()} — ${(t.date||'').slice(0,10)}</option>`).join('');
 if(sales.some(t=>String(t._idx)===old))select.value=old;
 document.getElementById('previousBillList').innerHTML=sales.length?`<table><thead><tr><th>Bill No.</th><th>Date</th><th>Customer</th><th>Product</th><th>Pieces</th><th>Total (PKR)</th><th>Action</th></tr></thead><tbody>${sales.map(t=>`<tr><td>${t.billNo||'—'}</td><td>${(t.date||'').slice(0,10)}</td><td>${transactionCustomer(t)||'—'}</td><td>${t.product||'—'}</td><td>${t.pieces||0}</td><td>${(+t.amount||0).toLocaleString()}</td><td><button class="btn" onclick="printPreviousBill(${t._idx})">Print</button></td></tr>`).join('')}</tbody></table>`:'No saved sale bills found.';
}
function printSelectedPreviousBill(){const idx=document.getElementById('previousBillSelect').value;if(idx===''){alert('Please select a previous bill.');return}printPreviousBill(+idx)}
function printPreviousBill(idx){
 const t=db.transactions[idx];if(!t||t.type!=='Sale'){alert('Saved sale bill not found.');return}
 const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const details=t.details||'', customer=transactionCustomer(t), product=t.product||((details.match(/Product:\s*([^,]+)/i)||[])[1]||''), pieces=+t.pieces||+((details.match(/Pieces:\s*([^,]+)/i)||[])[1])||0;
 const discountMatch=details.match(/Discount:\s*([\d.]+)%/i),discount=discountMatch?+discountMatch[1]:0;
 const net=+t.amount||0, gross=pieces*(+t.salePrice||+t.rate||0)||(discount<100?net/(1-discount/100):net), discountAmount=gross-net, rate=pieces?gross/pieces:0;
 const shop=db.settings?.shopName||'Smart Wholesale', city=db.settings?.city||'', shopArea=db.settings?.area||'';
 const billNo=t.billNo||('SI-'+String(idx+1).padStart(5,'0')),date=t.date?new Date(t.date).toLocaleDateString():'';
 const area=t.area||((details.match(/Area:\s*([^,]+)/i)||[])[1]||''), salesman=t.salesman||((details.match(/Salesman:\s*([^,]+)/i)||[])[1]||'');
 document.getElementById('printArea').innerHTML=`<div class="invoice"><h1>${esc(shop)}</h1><p style="text-align:center">${esc([city,shopArea].filter(Boolean).join(' • '))}</p><h2 style="text-align:center;margin-top:18px">SALE INVOICE</h2><div class="meta"><div><b>Bill No:</b> ${esc(billNo)}<br><b>Date:</b> ${esc(date)}</div><div><b>Customer:</b> ${esc(customer)}<br><b>Area:</b> ${esc(area||'-')}<br><b>Salesman:</b> ${esc(salesman||'-')}</div></div><table><thead><tr><th>Sr.</th><th>Product</th><th>Pieces</th><th>Rate (PKR)</th><th>Amount (PKR)</th></tr></thead><tbody><tr><td>1</td><td>${esc(product)}</td><td>${pieces}</td><td>${rate.toLocaleString()}</td><td>${gross.toLocaleString()}</td></tr></tbody></table><div class="total"><div><span>Gross Total</span><b>PKR ${gross.toLocaleString()}</b></div><div><span>Discount (${discount}%)</span><b>PKR ${discountAmount.toLocaleString()}</b></div><div style="border-top:2px solid #111;font-size:18px"><span><b>Net Payable</b></span><b>PKR ${net.toLocaleString()}</b></div></div><div class="bill-terms"><b>اہم نوٹ / IMPORTANT NOTICE</b><p>مال کے معیار، کمی یا کٹوتی کے حوالے سے کوئی کلیم قابلِ قبول نہیں ہوگا۔</p><p>سیلز مین کے ساتھ ہونے والا کھاتہ اور لین دین خریدار اور سیلز مین کی باہمی ذمہ داری ہے؛ اس معاملے میں کمپنی ذمہ دار نہیں ہوگی۔</p></div><p class="thanks">Thank you for your business.</p></div>`;
 window.print();
}
function backup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download='smart-wholesale-backup.json';a.click()}
function restoreData(e){const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();renderAll();alert('Data restored')}catch{alert('Invalid backup')}};r.readAsText(e.target.files[0])}

document.getElementById('recAmount').addEventListener('input',updateRecoveryInfo);
let mrDates=[];
function buildMarketDates(){
 const f=val('mrFrom'), t=val('mrTo');
 if(!f||!t||f>t){alert('Please select valid From and To dates');return}
 mrDates=[];let d=new Date(f+'T00:00:00'), end=new Date(t+'T00:00:00');
 while(d<=end){mrDates.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1)}
 renderMarketRecovery();
}
function customerOpeningDue(c){
 return +c.due||0;
}
function customerRecoveredBefore(name, before){
 return db.recoveries.filter(r=>r.customer===name && r.date<before).reduce((a,r)=>a+(+r.amount||0),0);
}
function renderMarketRecovery(){
 if(!mrDates.length){mrHead.innerHTML='<tr><th>Sr. No.</th><th>Customer Name</th><th>Opening Due</th><th>Remaining</th></tr>';mrBody.innerHTML='<tr><td colspan="4" class="empty">Select From/To dates and click Create Date Columns.</td></tr>';return}
 let q=val('mrSearch').toLowerCase();
 let customers=db.customers.filter(c=>(c.name||'').toLowerCase().includes(q));
 mrHead.innerHTML='<tr><th>Sr. No.</th><th>Customer Name</th><th>Opening Due</th>'+mrDates.map(d=>`<th>${d.slice(8,10)}<br>${d.slice(5,7)}</th>`).join('')+'<th>Remaining Due</th></tr>';
 mrBody.innerHTML=customers.length?customers.map((c,i)=>{
   let opening=customerOpeningDue(c), prior=customerRecoveredBefore(c.name,mrDates[0]), current=opening-prior;
   return `<tr><td>${i+1}</td><td>${c.name||''}</td><td>${opening}</td>${mrDates.map(d=>{let key=c.name+'|'+d;let old=db.recoveries.find(r=>r.customer===c.name&&r.date===d&&r.marketSheet);return `<td><input type="number" min="0" data-mr="${key}" value="${old?old.amount:''}" style="min-width:85px"></td>`}).join('')}<td class="mrRemain" data-customer="${c.name}">${current}</td></tr>`
 }).join(''):'<tr><td colspan="'+(4+mrDates.length)+'" class="empty">No customers found.</td></tr>';
 mrFoot.innerHTML=`<tr><th colspan="${3+mrDates.length}">Totals</th><th id="mrTotalRemain">0</th></tr>`;
 document.querySelectorAll('[data-mr]').forEach(x=>x.oninput=updateMarketTotals);
 updateMarketTotals();
}
function updateMarketTotals(){
 document.querySelectorAll('.mrRemain').forEach(cell=>{
   let name=cell.dataset.customer,c=db.customers.find(x=>x.name===name),opening=customerOpeningDue(c),prior=customerRecoveredBefore(name,mrDates[0]),sum=0;
   mrDates.forEach(d=>{let el=document.querySelector(`[data-mr="${CSS.escape(name+'|'+d)}"]`);sum+=+(el?.value||0)});
   cell.textContent=Math.max(0,opening-prior-sum);
 });
 let total=0;document.querySelectorAll('.mrRemain').forEach(x=>total+=+x.textContent||0);let el=document.getElementById('mrTotalRemain');if(el)el.textContent=total;
}
function saveMarketRecovery(){
 if(!mrDates.length){alert('Create date columns first');return}
 document.querySelectorAll('[data-mr]').forEach(el=>{
   let [name,date]=el.dataset.mr.split('|'),amount=+el.value||0;
   db.recoveries=db.recoveries.filter(r=>!(r.marketSheet&&r.customer===name&&r.date===date));
   if(amount)db.recoveries.push({customer:name,person:val('mrPerson'),amount,date,marketSheet:true});
 });
 save();renderMarketRecovery();renderAll();alert('Market recovery sheet saved');
}

renderAll();



// Enhanced multi-item invoice, proper tabular reports, and isolated report printing.
let saleCart=[]; let lastFinalizedSaleId=null;
function saleOptions(){return '<option value="">Select product</option>'+db.products.map(p=>`<option value="${String(p.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}">${p.name}${p.company?' — '+p.company:''}</option>`).join('')}
function addSaleRow(item={}){saleCart.push({product:item.product||'',pcs:+item.pcs||0,boxes:+item.boxes||0,cartons:+item.cartons||0,bonus:+item.bonus||0,rate:item.rate||0,discount:item.discount||0});renderSaleCart()}
function clearSaleCart(){saleCart=[];renderSaleCart()}
function saleRowPieces(r){const p=db.products.find(x=>x.name===r.product);return (+r.pcs||0)+(+r.boxes||0)*(+(p?.box)||12)+(+r.cartons||0)*(+(p?.carton)||144)}
function renderSaleCart(){const body=document.getElementById('saleCartRows');if(!body)return;body.innerHTML=saleCart.map((r,i)=>{const p=db.products.find(x=>x.name===r.product),qty=saleRowPieces(r),gross=qty*(+r.rate||0),discAmt=gross*(+r.discount||0)/100,net=gross-discAmt;return `<tr><td>${i+1}</td><td><select onchange="saleCart[${i}].product=this.value;const p=db.products.find(x=>x.name===this.value);saleCart[${i}].rate=p?.sale||0;renderSaleCart()">${saleOptions().replace(`value="${r.product}"`,`value="${r.product}" selected`)}</select><small>${p?`Description: ${p.name} | Company: ${p.company||'-'}`:''}</small></td><td><input type="number" min="0" value="${r.pcs}" style="width:65px" onchange="saleCart[${i}].pcs=+this.value||0;renderSaleCart()"></td><td><input type="number" min="0" value="${r.boxes}" style="width:65px" onchange="saleCart[${i}].boxes=+this.value||0;renderSaleCart()"></td><td><input type="number" min="0" value="${r.cartons}" style="width:70px" onchange="saleCart[${i}].cartons=+this.value||0;renderSaleCart()"></td><td><input type="number" min="0" value="${r.bonus}" style="width:65px" onchange="saleCart[${i}].bonus=+this.value||0;renderSaleCart()"></td><td>${qty}</td><td><input type="number" min="0" value="${r.rate}" style="width:90px" onchange="saleCart[${i}].rate=+this.value||0;renderSaleCart()"></td><td><input type="number" min="0" max="100" value="${r.discount}" style="width:70px" onchange="saleCart[${i}].discount=Math.min(100,Math.max(0,+this.value||0));renderSaleCart()"></td><td>${discAmt.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td><td>${net.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td><td><button class="btn red" onclick="saleCart.splice(${i},1);renderSaleCart()">Remove</button></td></tr>`}).join('');document.getElementById('saleCartTotal').textContent=saleCart.reduce((a,r)=>{let g=saleRowPieces(r)*(+r.rate||0);return a+g-g*(+r.discount||0)/100},0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
function unfinalizeLastSale(){if(!lastFinalizedSaleId){alert('No recently finalized sale in this session.');return}const t=db.transactions.find(x=>x.id===lastFinalizedSaleId);if(!t){alert('Bill not found.');return}if(!confirm('Unfinalize this bill and restore its stock?'))return;(t.items||[]).forEach(it=>{const p=db.products.find(x=>x.name===it.product);if(p)p.pieces=(+p.pieces||0)+(+it.pieces||0)});db.transactions=db.transactions.filter(x=>x.id!==lastFinalizedSaleId);lastFinalizedSaleId=null;save();renderAll();alert('Last bill unfinalized and stock restored.')}
const originalSaveTransaction=saveTransaction;
saveTransaction=function(type){if(type!=='Sale'){return originalSaveTransaction(type)}const customer=val('saleCustomer');if(!customer){alert('Please select a customer');return}if(!saleCart.length){alert('Please add at least one product');return}let items=[],gross=0,discountTotal=0;for(const r of saleCart){const p=db.products.find(x=>x.name===r.product),pieces=saleRowPieces(r),rate=+r.rate||0,d=+r.discount||0;if(!p||pieces<=0){alert('Choose a saved product and enter a quantity for every row.');return}if(d<0||d>100){alert('Discount must be 0–100%.');return}if(pieces>(+p.pieces||0)&&!confirm(`${p.name}: sale quantity exceeds stock. Continue?`))return;const g=pieces*rate,da=g*d/100;gross+=g;discountTotal+=da;items.push({product:p.name,description:p.name,company:p.company||'',pieces,pcs:+r.pcs||0,boxes:+r.boxes||0,cartons:+r.cartons||0,bonus:+r.bonus||0,rate,unitPrice:rate,discount:d,gross:g,discountAmount:da,amount:g-da,netAmount:g-da})}items.forEach(it=>{const p=db.products.find(x=>x.name===it.product);p.pieces=(+p.pieces||0)-it.pieces});const id=Date.now(),amount=gross-discountTotal,billNo='SI-'+String(id).slice(-8);const t={id,date:new Date().toISOString(),type:'Sale',customer,product:items.map(x=>x.product).join(', '),company:items.map(x=>x.company).filter(Boolean).join(', '),pieces:items.reduce((a,x)=>a+x.pieces,0),salePrice:0,rate:0,discount:gross?discountTotal/gross*100:0,details:`Customer: ${customer}, Products: ${items.map(x=>x.product).join(', ')}, Pieces: ${items.reduce((a,x)=>a+x.pieces,0)}, Salesman: ${val('saleSalesman')}, Area: ${val('saleArea')}, Discount: ${gross?(discountTotal/gross*100):0}%`,amount,items,salesman:val('saleSalesman'),area:val('saleArea'),billNo,gross,discountAmount:discountTotal,netAmount:amount};db.transactions.push(t);lastFinalizedSaleId=id;save();saleCart=[];renderSaleCart();renderAll();alert(`One bill finalized: ${billNo}. ${items.length} products included.`)};
function printSaleBill(){const customer=val('saleCustomer');let items=saleCart.filter(r=>r.product&&saleRowPieces(r)>0).map(r=>{let p=db.products.find(x=>x.name===r.product),pieces=saleRowPieces(r),rate=+r.rate||0,gross=pieces*rate,discount=+r.discount||0;return {product:r.product,description:r.product,pieces,pcs:+r.pcs||0,boxes:+r.boxes||0,cartons:+r.cartons||0,bonus:+r.bonus||0,rate,unitPrice:rate,gross,discount,discountAmount:gross*discount/100,amount:gross-gross*discount/100,netAmount:gross-gross*discount/100}});let t=null;if(!items.length){t=db.transactions.slice().reverse().find(x=>x.type==='Sale'&&transactionCustomer(x)===customer);if(t?.items)items=t.items.map(i=>({...i,description:i.description||i.product,pcs:+i.pcs||0,boxes:+i.boxes||0,cartons:+i.cartons||0,bonus:+i.bonus||0,unitPrice:+i.unitPrice||+i.rate||0,discount:i.discount||0,discountAmount:i.discountAmount||0,gross:i.gross??i.pieces*i.rate,amount:i.amount??i.pieces*i.rate-(i.discountAmount||0),netAmount:i.netAmount??i.amount??0}));else if(t)items=[{product:t.product,description:t.product,pieces:t.pieces,pcs:t.pieces,boxes:0,cartons:0,bonus:0,rate:t.salePrice||t.rate,unitPrice:t.salePrice||t.rate,gross:(t.pieces||0)*(t.salePrice||t.rate||0),discount:0,discountAmount:0,amount:t.amount,netAmount:t.amount}]}if(!customer||!items.length){alert('Select a customer and add products, or select a customer with a saved bill.');return}const gross=items.reduce((a,i)=>a+(+i.gross||0),0),disc=items.reduce((a,i)=>a+(+i.discountAmount||0),0),net=gross-disc,shop=val('shopName')||'Smart Wholesale',city=val('shopCity'),area=val('saleArea'),salesman=val('saleSalesman'),date=new Date().toLocaleDateString(),saved=t||db.transactions.slice().reverse().find(x=>x.type==='Sale'&&transactionCustomer(x)===customer),billNo=saved?.billNo||'SI-'+Date.now().toString().slice(-8);document.getElementById('printArea').innerHTML=`<div class="invoice"><h1>${esc(shop)}</h1><p style="text-align:center">${esc([city,area].filter(Boolean).join(' • '))}</p><h2 style="text-align:center">SALE INVOICE</h2><div class="meta"><div><b>Bill No:</b> ${esc(billNo)}<br><b>Date:</b> ${esc(date)}</div><div><b>Customer:</b> ${esc(customer)}<br><b>Area:</b> ${esc(area||saved?.area||'-')}<br><b>Salesman:</b> ${esc(salesman||saved?.salesman||'-')}</div></div><table><thead><tr><th>Sr.</th><th>Description</th><th>Pcs</th><th>Carton</th><th>Box</th><th>Bonus</th><th>Total Qty</th><th>Unit Price</th><th>Discount %</th><th>Discount Amount</th><th>Net Amount</th></tr></thead><tbody>${items.map((i,n)=>`<tr><td>${n+1}</td><td>${esc(i.description||i.product)}</td><td>${+i.pcs||0}</td><td>${+i.cartons||0}</td><td>${+i.boxes||0}</td><td>${+i.bonus||0}</td><td>${+i.pieces||0}</td><td>${(+i.unitPrice||+i.rate||0).toLocaleString()}</td><td>${+i.discount||0}%</td><td>${(+i.discountAmount||0).toLocaleString()}</td><td>${(+i.netAmount||+i.amount||0).toLocaleString()}</td></tr>`).join('')}</tbody></table><div class="total"><div><span>Total Amount</span><b>PKR ${gross.toLocaleString()}</b></div><div><span>Total Discount</span><b>PKR ${disc.toLocaleString()}</b></div><div style="border-top:2px solid #111;font-size:18px"><span><b>Net Payment</b></span><b>PKR ${net.toLocaleString()}</b></div><div style="border-top:1px solid #555"><span><b>Balance</b></span><b>PKR ${Math.max(0,customerPending(customer)-net).toLocaleString()}</b></div></div><p><b>Serial Number:</b> ${items.length} product(s) in this single bill.</p><div class="bill-terms"><b>اہم نوٹ / IMPORTANT NOTICE</b><p>مال کے معیار، کمی یا کٹوتی کے حوالے سے کوئی کلیم قابلِ قبول نہیں ہوگا۔</p><p>سیلز مین کے ساتھ ہونے والا کھاتہ اور لین دین خریدار اور سیلز مین کی باہمی ذمہ داری ہے؛ اس معاملے میں کمپنی ذمہ دار نہیں ہوگی۔</p></div><p class="thanks">Thank you for your business.</p></div>`;window.print()}
function toggleSalesReportFilters(){const show=val('reportType')==='Sales Report';document.getElementById('salesReportFilters').style.display=show?'block':'none';document.getElementById('salesReportCustomerFilter').style.display=show?'block':'none';if(show)populateSalesReportFilters()}
function populateSalesReportFilters(){const fill=(id,items,placeholder)=>{const el=document.getElementById(id);if(!el)return;const old=el.value;const vals=uniqueNames(items);el.innerHTML=`<option value="">${placeholder}</option>`+vals.map(v=>`<option value="${String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}">${v}</option>`).join('');if(vals.includes(old))el.value=old};fill('salesReportSalesman',db.transactions.filter(t=>t.type==='Sale').map(t=>t.salesman),'All Salesmen');fill('salesReportCustomer',customerNames(),'All Customers')}
function generateReport(){const type=val('reportType'),from=val('fromDate'),to=val('toDate');const inRange=d=>{let x=(d||'').slice(0,10);return (!from||x>=from)&&(!to||x<=to)};let title=type,headers=[],rows=[],summaryHtml='';const money=n=>'PKR '+(+n||0).toLocaleString(undefined,{maximumFractionDigits:2});if(type==='Stock Report'){headers=['Sr. No.','Company','Product','Supplier','Opening / Current Stock (pcs)','Cost Price','TP / Sale Rate','Stock Cost Value'];rows=db.products.map((p,i)=>[i+1,p.company||'-',p.name,p.supplier||'-',+p.pieces||0,money(p.cost),money(p.sale),money((+p.pieces||0)*(+p.cost||0))])}else if(type==='Sales Report'){populateSalesReportFilters();const sm=val('salesReportSalesman'),cust=val('salesReportCustomer');headers=['Sr. No.','Customer Serial No.','Date','Bill / Invoice No.','Customer Name','Salesman','Products','Quantity (pcs)','Gross Amount','Discount','Net Sale'];const sales=db.transactions.filter(t=>t.type==='Sale'&&inRange(t.date)&&(!sm||t.salesman===sm)&&(!cust||transactionCustomer(t)===cust));const customerSerial=name=>{let i=(db.customers||[]).findIndex(c=>c.name===name);return i>=0?i+1:'-' };rows=sales.map((t,i)=>{const name=transactionCustomer(t)||'-';const products=(t.items||[]).map(it=>it.description||it.product).filter(Boolean).join(', ')||t.product||'-';const qty=t.pieces??(t.items||[]).reduce((a,it)=>a+(+it.pieces||0),0);const gross=+(t.gross??(t.items||[]).reduce((a,it)=>a+(+it.gross||(+it.pieces||0)*(+it.rate||+it.unitPrice||0)),0)??t.amount)||0;const discount=+(t.discountAmount??(t.items||[]).reduce((a,it)=>a+(+it.discountAmount||0),0))||0;return [i+1,customerSerial(name),(t.date||'').slice(0,10),t.billNo||'-',name,t.salesman||'-',products,qty,money(gross),money(discount),money(t.amount)]});const byCustomer={};sales.forEach(t=>{const name=transactionCustomer(t)||'-';byCustomer[name]=(byCustomer[name]||0)+(+t.amount||0)});const customerTotals=Object.entries(byCustomer).sort((a,b)=>a[0].localeCompare(b[0]));summaryHtml=`<h3>Customer-wise Total Sale</h3><table><thead><tr><th>Customer Serial No.</th><th>Customer Name</th><th>Total Sale</th></tr></thead><tbody>${customerTotals.map(([name,total])=>`<tr><td>${customerSerial(name)}</td><td>${name}</td><td>${money(total)}</td></tr>`).join('')||'<tr><td colspan="3">No sales for selected filters.</td></tr>'}</tbody><tfoot><tr><th colspan="2">Grand Total Sale</th><th>${money(sales.reduce((a,t)=>a+(+t.amount||0),0))}</th></tr></tfoot></table>`}else if(type==='Purchase Report'){headers=['Sr. No.','Date','Company','Supplier','Product','Quantity (pcs)','Unit Cost','Total Purchase'];rows=db.transactions.filter(t=>t.type==='Purchase'&&inRange(t.date)).map((t,i)=>[i+1,(t.date||'').slice(0,10),t.company||'-',t.supplier||'-',t.product||'-',t.pieces||0,money(t.unitCost),money(t.amount)])}else if(type==='Recovery Report'){headers=['Sr. No.','Date','Customer / Shop','Recovery Person','Payment Received'];rows=db.recoveries.filter(r=>inRange(r.date)).map((r,i)=>[i+1,r.date||'-',r.customer||'-',r.person||'-',money(r.amount)])}else if(type==='Profit Report'){headers=['Sr. No.','Date','Company','Bill / Transaction','Sales','Purchase','Expenses','Estimated Profit'];let dates=[...new Set([...db.transactions.map(t=>(t.date||'').slice(0,10)),...db.expenses.map(e=>e.date).filter(Boolean)])].filter(inRange).sort();rows=dates.map((d,i)=>{let sales=db.transactions.filter(t=>t.type==='Sale'&&(t.date||'').slice(0,10)===d).reduce((a,x)=>a+(+x.amount||0),0),purchase=db.transactions.filter(t=>t.type==='Purchase'&&(t.date||'').slice(0,10)===d).reduce((a,x)=>a+(+x.amount||0),0),expenses=db.expenses.filter(e=>e.date===d).reduce((a,x)=>a+(+x.amount||0),0);return [i+1,d,'All Companies','Daily Summary',money(sales),money(purchase),money(expenses),money(sales-purchase-expenses)]})}else{headers=['Sr. No.','Company','Product','System Stock (pcs)','Recorded Movement (pcs)','Difference (pcs)','Status'];rows=db.products.map((p,i)=>{let movement=db.transactions.filter(t=>t.product===p.name||((t.items||[]).some(it=>it.product===p.name))).reduce((a,t)=>a+(t.type==='Purchase'?1:-1)*(+((t.items||[]).find(it=>it.product===p.name)?.pieces??(t.product===p.name?t.pieces:0))||0),0);let difference=(+p.pieces||0)-movement;return [i+1,p.company||'-',p.name,+p.pieces||0,movement,difference,difference===0?'Matched':'Check opening stock / movements']})}let html=`<div class="report-print"><h2 style="text-align:center">${title}</h2><p><b>From:</b> ${from||'All dates'} &nbsp;&nbsp; <b>To:</b> ${to||'All dates'} &nbsp;&nbsp; <b>Generated:</b> ${new Date().toLocaleDateString()}</p>${type==='Sales Report'?`<p><b>Salesman:</b> ${val('salesReportSalesman')||'All Salesmen'} &nbsp;&nbsp; <b>Customer:</b> ${val('salesReportCustomer')||'All Customers'}</p>`:''}<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v??''}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${headers.length}">No records for selected filters.</td></tr>`}</tbody></table>${summaryHtml}<p><b>Total Records / Bills:</b> ${rows.length}</p></div>`;document.getElementById('reportOutput').innerHTML=html;window.currentReportHtml=html;}
function printReportOnly(){const html=window.currentReportHtml||document.getElementById('reportOutput').innerHTML;if(!html||html.includes('Select a report and generate it')){alert('Generate a report first.');return}document.getElementById('printArea').innerHTML=`<div class="report-print">${html}</div>`;window.print()}
// Print only the requested report, never the previous bill.
document.querySelector('#reports .actions .btn.gray')?.setAttribute('onclick','printReportOnly()');
toggleSalesReportFilters();
// Keep saved customer list reusable in billing, and show saved names in a clear ledger table.
const oldRenderAll=renderAll;
renderAll=function(){oldRenderAll();if(document.getElementById('saleCartRows')&&!saleCart.length&&db.products.length)addSaleRow();};



// Final bill-print fix: always print every product as its own table row.
function printSaleBill(){
  const customer=val('saleCustomer');
  const rows=(saleCart||[]).filter(r=>r.product&&saleRowPieces(r)>0).map(r=>{
    const prod=db.products.find(x=>x.name===r.product), qty=saleRowPieces(r), rate=+r.rate||0;
    const gross=qty*rate, discount=+r.discount||0, discountAmount=gross*discount/100;
    return {product:r.product,pcs:+r.pcs||0,cartons:+r.cartons||0,boxes:+r.boxes||0,bonus:+r.bonus||0,qty,rate,gross,discount,discountAmount,net:gross-discountAmount};
  });
  if(!customer){alert('Please select a customer.');return;}
  if(!rows.length){alert('Please add the products to this bill. To reprint a saved bill, use Print Bills and select that bill.');return;}
  const esc2=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const money=x=>(+x||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const gross=rows.reduce((a,r)=>a+r.gross,0), disc=rows.reduce((a,r)=>a+r.discountAmount,0), net=gross-disc;
  const shop=val('shopName')||db.settings?.shopName||'Smart Wholesale', city=val('shopCity')||db.settings?.city||'', area=val('saleArea')||db.settings?.area||'', salesman=val('saleSalesman')||'';
  const billNo='SI-'+Date.now().toString().slice(-8), date=new Date().toLocaleDateString();
  document.getElementById('printArea').innerHTML=`<div class="invoice"><h1>${esc2(shop)}</h1><p style="text-align:center">${esc2([city,area].filter(Boolean).join(' • '))}</p><h2 style="text-align:center">SALE INVOICE</h2><div class="meta"><div><b>Bill No:</b> ${esc2(billNo)}<br><b>Date:</b> ${esc2(date)}</div><div><b>Customer:</b> ${esc2(customer)}<br><b>Area:</b> ${esc2(area||'-')}<br><b>Salesman:</b> ${esc2(salesman||'-')}</div></div><table><thead><tr><th>Sr.</th><th>Product Description</th><th>Pcs</th><th>Cotton / Carton</th><th>Box</th><th>Bonus</th><th>Total Qty</th><th>Unit Price</th><th>Total Amount</th><th>Discount %</th><th>Discount Amount</th><th>Net Payment</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc2(r.product)}</td><td>${r.pcs}</td><td>${r.cartons}</td><td>${r.boxes}</td><td>${r.bonus}</td><td>${r.qty}</td><td>${money(r.rate)}</td><td>${money(r.gross)}</td><td>${r.discount}%</td><td>${money(r.discountAmount)}</td><td>${money(r.net)}</td></tr>`).join('')}</tbody></table><div class="total"><div><span>Total Amount</span><b>PKR ${money(gross)}</b></div><div><span>Total Discount</span><b>PKR ${money(disc)}</b></div><div style="border-top:2px solid #111;font-size:18px"><span><b>Net Payment</b></span><b>PKR ${money(net)}</b></div></div><p><b>Products in this bill:</b> ${rows.length}</p><div class="bill-terms"><b>IMPORTANT NOTICE</b><p>مال کے معیار، کمی یا کٹوتی کے حوالے سے کوئی کلیم قابلِ قبول نہیں ہوگا۔</p><p>سیلز مین کے ساتھ ہونے والا کھاتہ اور لین دین خریدار اور سیلز مین کی باہمی ذمہ داری ہے؛ اس معاملے میں کمپنی ذمہ دار نہیں ہوگی۔</p></div><p class="thanks">Thank you for your business.</p></div>`;
  window.print();
}
function printPreviousBill(idx){
  const t=db.transactions[idx]; if(!t||t.type!=='Sale'){alert('Saved sale bill not found.');return;}
  const esc2=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const money=x=>(+x||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  let items=Array.isArray(t.items)?t.items.map(i=>{
    const rate=+(i.unitPrice??i.rate)||0, qty=+(i.pieces)||0, gross=+(i.gross??(qty*rate))||0, da=+(i.discountAmount??(gross*(+i.discount||0)/100))||0;
    return {product:i.description||i.product||'Product',pcs:+i.pcs||0,cartons:+i.cartons||0,boxes:+i.boxes||0,bonus:+i.bonus||0,qty,rate,gross,discount:+i.discount||0,discountAmount:da,net:+(i.netAmount??i.amount??(gross-da))||0};
  }):[];
  if(!items.length){
    const productNames=String(t.product||'').split(/,\s*/).filter(Boolean), qty=+t.pieces||0, net=+t.amount||0, rate=+(t.salePrice||t.rate)||0;
    const names=productNames.length?productNames:['Product'];
    if(names.length===1){const gross=+(t.gross??(rate*qty))||net;items=[{product:names[0],pcs:qty,cartons:0,boxes:0,bonus:0,qty,rate,gross,discount:+t.discount||0,discountAmount:+(t.discountAmount??(gross-net))||0,net}];}
    else { items=names.map((name,i)=>({product:name,pcs:i===0?qty:0,cartons:0,boxes:0,bonus:0,qty:i===0?qty:0,rate:i===0?rate:0,gross:i===0?net:0,discount:0,discountAmount:0,net:i===0?net:0})); }
  }
  const gross=items.reduce((a,r)=>a+r.gross,0), disc=items.reduce((a,r)=>a+r.discountAmount,0), net=items.reduce((a,r)=>a+r.net,0);
  const customer=transactionCustomer(t)||t.customer||'-', shop=db.settings?.shopName||'Smart Wholesale', city=db.settings?.city||'', area=t.area||db.settings?.area||'', salesman=t.salesman||'';
  document.getElementById('printArea').innerHTML=`<div class="invoice"><h1>${esc2(shop)}</h1><p style="text-align:center">${esc2([city,area].filter(Boolean).join(' • '))}</p><h2 style="text-align:center">SALE INVOICE</h2><div class="meta"><div><b>Bill No:</b> ${esc2(t.billNo||('SI-'+String(idx+1).padStart(5,'0')))}<br><b>Date:</b> ${esc2(t.date?new Date(t.date).toLocaleDateString():'')}</div><div><b>Customer:</b> ${esc2(customer)}<br><b>Area:</b> ${esc2(area||'-')}<br><b>Salesman:</b> ${esc2(salesman||'-')}</div></div><table><thead><tr><th>Sr.</th><th>Product Description</th><th>Pcs</th><th>Cotton / Carton</th><th>Box</th><th>Bonus</th><th>Total Qty</th><th>Unit Price</th><th>Total Amount</th><th>Discount %</th><th>Discount Amount</th><th>Net Payment</th></tr></thead><tbody>${items.map((r,i)=>`<tr><td>${i+1}</td><td>${esc2(r.product)}</td><td>${r.pcs}</td><td>${r.cartons}</td><td>${r.boxes}</td><td>${r.bonus}</td><td>${r.qty}</td><td>${money(r.rate)}</td><td>${money(r.gross)}</td><td>${r.discount}%</td><td>${money(r.discountAmount)}</td><td>${money(r.net)}</td></tr>`).join('')}</tbody></table><div class="total"><div><span>Total Amount</span><b>PKR ${money(gross)}</b></div><div><span>Total Discount</span><b>PKR ${money(disc)}</b></div><div style="border-top:2px solid #111;font-size:18px"><span><b>Net Payment</b></span><b>PKR ${money(net)}</b></div></div><p><b>Products in this bill:</b> ${items.length}</p><div class="bill-terms"><b>IMPORTANT NOTICE</b><p>مال کے معیار، کمی یا کٹوتی کے حوالے سے کوئی کلیم قابلِ قبول نہیں ہوگا۔</p><p>سیلز مین کے ساتھ ہونے والا کھاتہ اور لین دین خریدار اور سیلز مین کی باہمی ذمہ داری ہے؛ اس معاملے میں کمپنی ذمہ دار نہیں ہوگی۔</p></div><p class="thanks">Thank you for your business.</p></div>`;
  window.print();
}


/* ===== Farhan App Security / Finalize / Recovery Print Upgrade ===== */
const AUTH_KEY='farhanWholesaleAuth';
const APP_USER='Farhan';
const APP_PASSWORD='12345'; // Change this in app.js if desired.
const UNFINALIZE_PIN='7860'; // PIN required for unfinalize.

function login(){
  const u=(document.getElementById('loginUser').value||'').trim();
  const p=document.getElementById('loginPass').value||'';
  const err=document.getElementById('loginError');
  if(u===APP_USER && p===APP_PASSWORD){
    localStorage.setItem(AUTH_KEY,'1');
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('appRoot').classList.remove('locked');
    if(typeof renderAll==='function') renderAll();
  }else{
    err.style.display='block';
  }
}
function logout(){
  localStorage.removeItem(AUTH_KEY);
  location.reload();
}
(function initLogin(){
  const ok=localStorage.getItem(AUTH_KEY)==='1';
  if(ok){
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('appRoot').classList.remove('locked');
  }
  document.getElementById('loginPass')?.addEventListener('keydown',e=>{if(e.key==='Enter')login()});
})();

/* Replace the session-only unfinalize with a PIN-protected saved-bill workflow. */
function unfinalizeLastSale(){
  const sales=db.transactions.filter(x=>x.type==='Sale');
  const t=sales[sales.length-1];
  if(!t){alert('No finalized bill found.');return;}
  const pin=prompt('Enter Unfinalize PIN:');
  if(pin===null)return;
  if(pin!==UNFINALIZE_PIN){alert('Wrong Unfinalize PIN.');return;}
  if(!confirm('Unfinalize this bill and restore its stock?'))return;
  (t.items||[]).forEach(it=>{
    const p=db.products.find(x=>x.name===it.product);
    if(p)p.pieces=(+p.pieces||0)+(+it.pieces||0);
  });
  db.transactions=db.transactions.filter(x=>x.id!==t.id);
  save(); renderAll();
  alert('Bill unfinalized and stock restored.');
}

/* Isolated customer payment/recovery print. It never prints the previous bill. */
function printRecoverySheet(){
  const customer=val('recCustomer');
  if(!customer){alert('Select a customer first.');return;}
  const c=db.customers.find(x=>x.name===customer);
  const opening=+(c?.due||0);
  const bills=db.transactions.filter(t=>t.type==='Sale'&&transactionCustomer(t)===customer);
  const payments=db.recoveries.filter(r=>r.customer===customer);
  const billed=bills.reduce((a,t)=>a+(+t.amount||0),0);
  const paid=payments.reduce((a,r)=>a+(+r.amount||0),0);
  const balance=opening+billed-paid;
  const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  document.getElementById('printArea').innerHTML=`
    <div class="recovery-print">
      <h1>${esc(db.settings?.shopName||'Smart Wholesale')}</h1>
      <h2>Payment / Recovery Ledger</h2>
      <p><b>Customer:</b> ${esc(customer)} &nbsp; <b>Date:</b> ${new Date().toLocaleDateString()}</p>
      <div class="summary">
        <span>Opening Due: <b>PKR ${opening.toLocaleString()}</b></span>
        <span>Total Bills: <b>PKR ${billed.toLocaleString()}</b></span>
        <span>Payments: <b>PKR ${paid.toLocaleString()}</b></span>
        <span>Balance: <b>PKR ${balance.toLocaleString()}</b></span>
      </div>
      <table><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Person / Details</th></tr></thead>
      <tbody>
      ${bills.map(t=>`<tr><td>${(t.date||'').slice(0,10)}</td><td>Bill</td><td>PKR ${(+t.amount||0).toLocaleString()}</td><td>${esc(t.salesman||t.details||'')}</td></tr>`).join('')}
      ${payments.map(r=>`<tr><td>${esc(r.date||'')}</td><td>Payment Received</td><td>PKR ${(+r.amount||0).toLocaleString()}</td><td>${esc(r.person||'')}</td></tr>`).join('')}
      </tbody></table>
      <p style="text-align:right;margin-top:15px"><b>Remaining Balance: PKR ${balance.toLocaleString()}</b></p>
    </div>`;
  window.print();
}

/* Consolidated market recovery print: one area/person sheet with all selected customers. */
function printMarketRecoverySheet(){
  if(!mrDates.length){alert('Create the date columns first.');return;}
  const person=val('mrPerson');
  const q=val('mrSearch').toLowerCase();
  const customers=db.customers.filter(c=>(c.name||'').toLowerCase().includes(q));
  const esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let totalCollected=0,totalRemaining=0;
  const rows=customers.map((c,i)=>{
    const opening=customerOpeningDue(c);
    const prior=customerRecoveredBefore(c.name,mrDates[0]);
    let collected=0;
    mrDates.forEach(d=>{
      const el=document.querySelector(`[data-mr="${CSS.escape(c.name+'|'+d)}"]`);
      collected += +(el?.value||0);
    });
    const saved= db.recoveries.filter(r=>r.customer===c.name && r.marketSheet && mrDates.includes(r.date));
    if(!collected) collected=saved.reduce((a,r)=>a+(+r.amount||0),0);
    const remaining=Math.max(0,opening-prior-collected);
    totalCollected+=collected; totalRemaining+=remaining;
    return `<tr><td>${i+1}</td><td>${esc(c.name)}</td><td>${esc(c.area||'')}</td><td>PKR ${opening.toLocaleString()}</td><td>PKR ${collected.toLocaleString()}</td><td>PKR ${remaining.toLocaleString()}</td></tr>`;
  }).join('');
  document.getElementById('printArea').innerHTML=`
    <div class="recovery-print">
      <h1>${esc(db.settings?.shopName||'Smart Wholesale')}</h1>
      <h2>Market Recovery / Payment Collection Sheet</h2>
      <p><b>From:</b> ${esc(mrDates[0])} &nbsp; <b>To:</b> ${esc(mrDates[mrDates.length-1])} &nbsp; <b>Recovery Person:</b> ${esc(person||'All')}</p>
      <table><thead><tr><th>Sr.</th><th>Customer</th><th>Area</th><th>Opening Due</th><th>Recovery Collected</th><th>Remaining Due</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="6">No customers found.</td></tr>'}</tbody>
      <tfoot><tr><th colspan="4">TOTAL</th><th>PKR ${totalCollected.toLocaleString()}</th><th>PKR ${totalRemaining.toLocaleString()}</th></tr></tfoot>
      </table>
      <p style="margin-top:20px"><b>Total Customers:</b> ${customers.length} &nbsp; <b>Total Recovery:</b> PKR ${totalCollected.toLocaleString()}</p>
    </div>`;
  window.print();
}

/* Redirect the existing buttons to their isolated print builders. */
document.querySelector('#recovery .actions .btn.gray')?.setAttribute('onclick','printRecoverySheet()');
document.querySelector('#marketRecovery .actions .btn.gray')?.setAttribute('onclick','printMarketRecoverySheet()');

/* Add a visible Logout button to settings without changing the existing layout. */
(function addLogout(){
  const panel=document.querySelector('#settings .actions');
  if(panel && !document.getElementById('logoutBtn')){
    const b=document.createElement('button');
    b.id='logoutBtn'; b.className='btn red'; b.textContent='Logout';
    b.onclick=logout; panel.appendChild(b);
  }
})();
