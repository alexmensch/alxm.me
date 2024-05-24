---
title: "Working as a consultant in the UK as a US citizen"
date: 2024-05-23
update_date: 2024-05-24
---

[[toc]]

_**Disclaimer**: I am not a tax expert or accountant, so make sure you get professional advice to confirm that any decisions you make are right for you and your situation. The rules are complex and change regularly, so if you see any errors in what I have written, please feel free to contact me at hello [at] alxm.me._

# Context

I am a dual UK/US citizen living in the UK, and I needed to determine the right approach to do consultancy work with clients in the UK. This is a complex area because of the need for US citizens to report and pay taxes on global income [regardless of their country of tax residency](https://en.wikipedia.org/wiki/Accidental_American#Taxation_of_non-residents). I'm writing down what I learned to help others because this is a common situation for US citizens in the UK, and it's not easy to find all of the answers.

## Goals

I decided to incorporate a UK [limited company](https://www.gov.uk/limited-company-formation) and report this in my US tax filings as a "[Foreign Disregarded Entity](https://www.irs.gov/instructions/i8858#en_US_202312_publink1000277262)". I'll describe what I decided to do in detail below, but the reasons I decided to do this were:

1. I expected my income into the limited company to be uneven throughout the year.
2. I wanted to control when I took personal income from the company.
3. I wanted to minimize my overall tax obligations.

# UK Consulting Entity

As a for-profit consultant, you can register yourself as a sole trader or as a limited company. This is roughly equivalent to the option between setting up a sole proprietorship or LLC in the US.

- A **sole trader** is a pass-through designation, so you have to declare all of your earnings (turnover) as income and pay regular income tax on all profit for the year. Because of my specific goals, I didn't look into this options in much detail, but ultimately your responsible for keeping records for the business and then filing a [self-assessment tax return](https://www.gov.uk/self-assessment-tax-return-forms) with HMRC.
- A **limited company** is a real corporate entity, which means that you'll need to [register your company](https://www.gov.uk/limited-company-formation/register-your-company) with [Companies House](https://www.gov.uk/government/organisations/companies-house) and take care of accounting throughout the year, including annual tax and required filings with HMRC & Companies House. If privacy is a consideration for you, be aware that anyone in the world can look up company information, including annual statements and company Directors, on the Companies House website.

I decided to form a limited company for the reasons I outlined above. Expecting uneven income from consulting activities month to month, I wanted to have the flexibility to decide when to pay myself. As a Director in the company, you can pay yourself via dividends, which have a more favorable tax treatement than regular wages. Not only are dividends taxed at a lower rate, but neither you nor the copmany needs to pay National Insurance tax.

If your consulting practice is your only source of income, the usual strategy is to put yourself on payroll below the National Insurance secondary threshold (£9,100 for the [2024/25 UK tax year](https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions)) and then pay yourself in dividends beyond that. However, I would suggest speaking to your US tax advisor for your particular situation as this may or may not minimize your US tax burden according to the US-UK tax treaty rules.

## IR35

So if setting up a limited company and paying yourself in dividends is a way to minimize taxes, why doesn't everyone do this? Enter IR35, otherwise known as [off-payroll working](https://www.gov.uk/guidance/understanding-off-payroll-working-ir35). The rules themselves are fairly intricate and specific, but if you apply common sense to your situation, it should be fairly clear whether you are "inside" (considered an employee masquerading as a contractor) or "outside" (considered a legitimate contractor) of IR35.

What the law says is that even if you are technically a contractor (ie. not an actual employee of your client), but you _behave_ like an employee, you need to pay taxes as if you were an employee, regardless of the existence of a corporate entity. That's the spirit of the ruling, and it's designed to prevent tax avoidance. Despite any language that you use in your contract with your client, HMRC will always consider the actual situation you're in with your client.

IR35 determination has been a controversial area for many years, and due to abuse of the rules, recent changes mean that it is now the responsibility of your _client_ to determine your IR35 status. So make sure that when you start to work with a new client, you are clear whether they consider you inside or outside IR35. You may find that larger clients are more conservative and will not take on contractors outside of IR35 as a general rule.

If you're not sure whether you fall inside or outside of IR35, you can use [this tool](https://www.gov.uk/guidance/check-employment-status-for-tax), the result of which HMRC will stand behind as long as your answers are truthful. You can also save the result of this tool and share it with your client alongside your contract.

## VAT Registration

When you set up your UK limited company, you need to make a decision as to whether to [register for VAT](https://www.gov.uk/register-for-vat/how-register-for-vat) or not. You must register your company for VAT if your turnover is more than £90,000 in the course of a year. If you expect your turnover to exceed or come close to this, my recommendation is to go ahead and register as there are no real downsides other than some extra reporting. Being registered for VAT means that you must charge your clients VAT, and it also entitles you to deduct any VAT the company pays from VAT you have collected and hence owe HMRC.

VAT registration does increase your reporting burden a bit, but it's not a huge task. VAT reporting is done quarterly. If you use an accounting tool like [Xero](https://www.xero.com/uk/), it will automatically submit VAT reporting information to HMRC and help you figure out what you owe or are due as a refund. (This is where I find Europe in general to be far ahead of the US.)

If you're under the £90,000 turnover threshold, there's not a huge benefit to VAT registration for a consulting business where your time is the product you're selling since your company will not be incurring many VAT inclusive costs. However, there's no real downside because the VAT you charge your clients simply gets passed along to HMRC and is something they can write off against any VAT they have to pay on their own purchases.

# US Considerations

The United States is one of the only countries in the world that requires its citizens to pay tax regardless of their country of residence. There's not much you can do about this, but since UK taxes are generally higher regardless, the goals are to either reduce UK-sourced taxes or reduce the reporting burden.

I already covered the UK side of the tax equation above, so the other consideration is reducing the complexity of filing to minimize professional (tax / accounting) fees. The IRS has a designation called a "[Foreign Disregarded Entity](https://www.irs.gov/instructions/i8858#en_US_202312_publink1000277262)" (FDE), which means that even though you own a foreign corporation, filing to treat that corporation as an FDE means that it will be treated as "transparent". This means that it's effectively treated as a sole proprietorship from a US tax filing standpoint, and has the additional benefit of significantly reducing the tax filing burden each year.

In order to receive this treatment, you must to designate the foreign corporation as an FDE within 75 days of when you wish to give it that treatment. So from a practical standpoint that means filing IRS [Form 8832](https://www.irs.gov/forms-pubs/about-form-8832) within 75 days of incorporating in the UK. The good news is that you can do this yourself by filling out the details in the form (don't worry, it's easy), and mailing it directly to the IRS. They will not mail you a return receipt, so make sure you send the letter with [tracking & signature](https://www.royalmail.com/sending/international/international-tracked-signed).

Lastly, when it comes time to file, your tax advisor can file IRS [Form 8858](https://www.irs.gov/forms-pubs/about-form-8858) for your FDE instead of [Form 5471](https://www.irs.gov/forms-pubs/about-form-5471) and related [GILTI calculations](https://www.investopedia.com/global-intangible-low-taxed-income-gilti-definition-5097113), which are used for US interests in controlled foreign corporations (CFCs) and have a higher filing burden.

# Tax and reporting filings

With all of that covered, here's a summary of your annual filings for both the UK and US.

**UK Self-assessment**
- You need to [tell HMRC](https://www.gov.uk/register-for-self-assessment) that you intend to file a self-assessment return in advance.
- If you are non-domiciled in the UK or a part-year resident, you may also need to file [SA109](https://www.gov.uk/government/publications/self-assessment-residence-remittance-basis-etc-sa109) as part of your self-assessment return.

**UK Limited company**
- Statutory (annual) accounts, which are reported both to Companies House and HMRC.
- Company tax return.
- You'll also need to [keep specific records](https://www.gov.uk/running-a-limited-company/taking-money-out-of-a-limited-company) any time you pay dividends out of your company.

**US Federal**
- Form 1040 with any relevant additional forms & schedules.
- [FBAR](https://www.irs.gov/businesses/small-businesses-self-employed/report-of-foreign-bank-and-financial-accounts-fbar) if any foreign bank accounts you own ever reached $10,000 USD equivalent during the US tax year.
- Form 8858, which covers your FDE.
- [Form 8938](https://www.irs.gov/forms-pubs/about-form-8938) (FATCA) if your total foreign accounts ever reached $300,000 equivalent or more during the year, or $200,000 at the end of the US tax year.

**US State**
- You should only need to file a final state return if you have a partial year of residence in the US. This may also be required if you have any state-sourced income (eg. deferred income via stock options earned in that state), which will involve filing a non-resident state return.

**US Other**
- Form 8832 is a one-time election to designate your UK limited company as a FDE, which is a form you can mail to the IRS yourself.

## Professional help

**Accounting**

I would definitely recommend working with an accounting firm in the UK for your limited company. You can do a lot of it yourself, but it's not too expensive to retain a firm to get help where you need it, especially during the first year when everything will be new. You will be able to do more yourself in future years if you'd like to, but it will be heplful to have someone that you can get advice from when you need it.

**Taxes**

You can try to find a firm that does both UK and US taxation, but I've found that to be ridiculously expensive. I've been quoted no less than £4,000 and in one case a minimum of £5,500 to file combined US and UK taxes each year, which I personally find borderline criminal unless you are either quite wealthy or have a very complex tax situation that justifies the cost.

Personally, I'm using a US-based firm for all US filing, and then a UK firm for my UK self-assessment filing. There's not as much coordination between the two regimes required as I initially thought, but it's good to have someone on the UK side that's at least familiar with US expat issues. The way I look at it is that UK taxes will always be higher than American taxes, so effort should be spent minimizing UK taxes, which only UK-based tax professionals will be familiar with, and then minimizing the cost of doing all the required US filings, which you have to do no matter what.

# Questions?

I'm not an expert in any of these areas, but I've simply done a lot of research and have had a number of conversations with the relevant tax and accouting professionals. If you have experience in these areas, and you see any errors in what I have written, please contact me, and I will make any necessary corrections or add clarifications.