---
title: "Working as a consultant in the UK as a US citizen"
date: 2024-05-23
---

I'm not a tax expert or accountant, but this is the thinking behind where I landed, which is to create a UK Limited company with myself as the only Director for my consulting work.

### UK

You can register yourself as a sole trader or as a limited liability company. This is equivalent to the option between setting up a sole proprietorship or LLC in the US.
- A sole trader is a pass-through designation, so you have to declare all of your earnings (turnover) as income and pay regular income tax on everything as you earn it. I didn't look into this that much, but there may be some things you need to do to register with HMRC, but at the end of the day, I believe you simply file a self-assessment tax return (SA109).
- A limited company is a real corporate entity, which means that you'll need to register a business with Companies House and take care of accounting throughout the year, including annual tax and required filings with HMRC / Companies House. If privacy is a consideration, anyone in the world can look up company information on the Companies House website.
I went the limited company route for a few reasons despite the extra overhead:
1. I expect my income to be lumpy, so accumulating the income in the Limited company allows me to decide when I want to extract earnings from it.
2. If you don't need a steady income each month, you can entirely pay yourself via dividends, which means that you can avoid National Insurance taxation since you're not technically on employee payroll for the company.
There are some tax exclusions, so you might be able to take a very small salary (something on the order of £12,000 a year) without paying NI tax, but talk to an accountant about that because (a) these exclusions are shrinking and to me it looks like they're going away; (b) everyone's situation is unique; (c) if you're considered non-domiciled, the rules are changing completely over the next 4 years.

One thing to be careful about is the famous IR35 rule. It's fairly complex, but if you apply common sense logic, what the law says is that even if you are technically a contractor (ie. not an actual employee of your client), but you behave like an employee, you need to pay regular employee taxes. That's the gist of it. You can write all the fancy contract clauses you want, but HMRC doesn't care -- they're going to look at the actual situation you're in.

If you're not sure, you can use [this tool](https://www.gov.uk/guidance/check-employment-status-for-tax), the result of which HMRC will stand behind as long as your answers are truthful.

### US

As you no doubt know, Americans have to pay tax regardless of their country of residence. So there's not much you can do here, but since UK taxes are higher regardless, the main goal is to either reduce UK taxation or reduce the reporting burden.

The main thing you can do is to reduce the complexity of filing to minimize professional (tax / accounting) fees. The IRS has a designation called a "Foreign Disregarded Entity" (FDE) which means that even though you own a foreign corporation, you can file to treat that foreign corporation as an FDE. This means that it will be treated as "transparent", which means that it's basically treated as a sole proprietorship from a US tax filing standpoint, and significantly reduces the tax filing burden each year.

The trick is that you have to designate the foreign corporation as an FDE within 75 days of when you wish to give it that treatment. So from a practical standpoint that means filing IRS Form 8832 within 75 days of incorporating in the UK. The good news is that you can do this yourself by filling out Form 8832 (it's easy) and mailing it to the IRS. They will not mail you a return receipt, so just keep delivery / tracking records.

Then when it comes time to file, your tax person can file IRS Form 8858 for your FDE instead of Form 5471 and related GILTI filings.

### Annual tax filings

So, with all of that...this is what you'll need to file each year:
1. UK: Personal
	- SA100 (Self-assessment return) -- you need to tell HMRC that you intend to file a self-assessment return in advance
	- Maybe: SA109 (if you are a part year resident, non-domiciled, etc.)
2. UK: Limited company
	- A number of required filings for the limited company, including end of year statement, taxes, etc. that your accounting firm will take care of.
	- You'll also need help filing the required information each time you withdraw earnings as a dividend from the company.
3. US: Annual
	- Form 1040 with ex-pat considerations
	- FBAR if any foreign bank accounts ever reached $10,000 equivalent during the year
	- Form 8858 (to cover your FDE)
	- Form 8832 (one-time form, do this yourself, designate your limited company as an FDE)
	- FATCA Form 8938 if your total foreign accounts ever reached $100,000 equivalent or more during the year
	- Maybe: State return if you have a partial year in the US

Alright, hope this helps... :) I would definitely recommend working with an accounting firm in the UK. You can do a lot of it yourself, but it's not too expensive to retain a firm to get help where you need it, especially during the first year when everything will be new.

You can try to find a firm that does both UK and US taxation, but I've found that to be ridiculously expensive (we're talking something like £5,500+ to file taxes each year) and so I'm using a US-based firm for the US filing, and then a UK firm for the UK filings. There's not actually as much coordination required as I initially thought, but it's good to have someone on the UK side that's at least familiar with US expat issues, but there's no requirement to also have them do the filing for you

---

When you set up your UK limited company, you need to make a decision as to whether to register for VAT or not. You have to register your company for VAT if your turnover (revenue) is more than £85,000 in the course of a year. If you expect your revenue to exceed this, I would just go ahead and register to reduce the complexity of backwards treatment if you cross that threshold.

Again, it does increase the reporting burden a bit, but it's not that bad. If you use an accounting tool like Xero, it will automatically submit VAT reporting information to HMRC and help you figure out what you owe or are due as a refund. (This is where Europe in general is lightyears ahead of the US...) VAT reporting is done quarterly.

There's not much benefit to VAT registration as a consultant (because you're not going to be buying things as company costs that include VAT), but there's no real downside because the VAT you charge your clients is something they can write off against any VAT they have to pay on their own purchases. So it works out just fine.
