---
theme: dashboard
title: Coroners' Inquests
toc: false
style: ./custom-styles.css
---
<style>
div.ci_summary {font-size:20px; weight: bold; }
.ci_centred {text-align: center;}
</style>

# Suspicious deaths in 18th-century Westminster
 
<div class="grid grid-cols-3">
<div class="card">18th-century inquests were usually held soon after a sudden, violent, accidental or unexplained death. This dashboard explores gender and verdicts across nine parishes between 1760 and 1799.</div>
<div class="card">
<h2>Inquests</h2>
	<div class="ci_summary ci_centred">${d3.format(",")(inquests_count)}</div>
	<div class="ci_centred">${d3.format(".2%")(inquests_burials_pct)} of burials</div>
</div>
<div class="card">
<h2>Burials</h2>
	<div class="ci_summary ci_centred">${d3.format(",")(burials_sum)}</div>
	<div class="ci_centred">see notes on sources</div>
</div>
</div>

```js
// https://observablehq.com/@tophtucker/horizontal-inputs
// https://observablehq.com/@martien/inputs
// this might want a bit more styling to define each input?

const genderVerdictForm = view(
Inputs.form(
	{
  gender: Inputs.checkbox(valGender, {label: "gender", value: valGender }),
	verdict: Inputs.select(
				["All"].concat(valVerdict), // sort here if you need to
				{label: "verdict", unique: true,}
				) 
  } ,
  {
    template: (inputs) => htl.html`<div style="display: flex; gap: 2em" class="styled">
    <em>Filter by...</em>
    <style>
  div.styled { text-align: right; }
  div.styled form>label { font-weight: bold; }
</style>
  ${Object.values(inputs)}
</div>`
  }
 )
);

```
<div class="grid grid-cols-2">
  <div class="card">
  ${mapBurials(parishes_geojson)}
  </div>
  <div class="card">
  ${heatBurials(filterGenderVerdictForm)}
  </div>
</div>

<div class="grid grid-cols-1" style="padding: 0;">
	<div class="card">
	${inquestsTable(filterGenderVerdictForm)}
	</div>
</div>


<div class="grid grid-cols-2">
<div class="card">
<h2>Sources</h2>

- [Westminster coroners' inquests data](https://doi.org/10.5281/zenodo.4402837) ([London Lives](https://www.londonlives.org/)) 
- [London weekly bills of mortality, 1644-1849](https://reshare.ukdataservice.ac.uk/854104/) ([Campop](https://www.campop.geog.cam.ac.uk/research/projects/migrationmortalitymedicalisation/))
- [Locating London's Past map data](https://www.locatinglondon.org/about/data-downloads)

<h2>See also</h2>

- [Death by Numbers: the Bills of Mortality project](https://deathbynumbers.org/)
- [Coroners' Inquests background information](https://www.londonlives.org/about/ic/) (London Lives)
- [Causes of death in Georgian London: index of verbs and objects](https://codepen.io/Rbrath/full/rNewgde) (Richard Brath)

</div>

<div class="card">
<h2>Notes on sources</h2>

*Coroners' inquests* were usually held within a few days of a suspicious or unexplained death, at a local alehouse, parish workhouse or in the building in which the death occurred. Deaths among prisoners in custody were also subject to an automatic inquest. The data used here is based on the formal *inquest*, which identified the deceased, date, location, cause of death and gave the jury's verdict.

The *weekly bills of mortality* represent the most complete source of burials data available for London over the 17th and 18th centuries. However, [they do not count *all* deaths](https://deathbynumbers.org/analysis/religion/), as they exclude burials of Nonconformists (of whom there were growing numbers), Catholics and others outside the Church of England. The Bills probably account for around 90% of burials overall, but levels of nonconformity could vary between parishes. 
</div>
</div>


```js
function mapBurials(data) {
return Plot.plot({
		title: "Space",
		//subtitle: "compare gender and verdicts across parishes",
    projection: {
    type: "reflect-y",
    domain: data // "focus" on target polygon
  },
  
  color: {
    //type: "quantile",
    //reverse: true,
    //n: 9,
    scheme: "oranges",
    label: "% of parish burials",
    legend: true
  },

  marks: [
    Plot.geo(data, { 
    		fill: (d) => parishInquestsBurialsGenVerMap.get(d.properties.parish),
    		//tip: true,
        channels: {
      	// label: colname
      			parish: "parish",
      			inquests: (d) => parishInquestsBurialsGenVerNIMap.get(d.properties.parish), // filtered count
      			"burials 1760-99":  (d) => parishInquestsBurialsGenVerNBMap.get(d.properties.parish), // total. 
      			"population 1800": "pop_1800",
      		} , 
  			tip: {
  					fontSize:13,
  					lineHeight:1.3,
    				format: {
    					parish: true, 
      				inquests: true,
      				fill: true, 
      				burials: true,
    				} // format
    			} // /tip
    	}), // geo
    	
  	Plot.geo(data, {stroke: "black", strokeWidth: 0.5}), // ensure boundaries show even if no data.

  ]
})
}
```

```js
function heatBurials(data) {
return Plot.plot({
	title: "Time",
	//subtitle: "changes in gender and verdict composition",
	//width, // don't want this in the card!
	padding: 0,
	marginLeft: 70,
  grid: true,

	x: {
			label: null, 
			domain: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] // put months in right order for doc_month_lab... ought to do this properly really...
		},  
  
	y: {label: null}, 
  color: {type: "linear", scheme: "Oranges", legend: true, label: "inquests"},
  
	marks: [
		Plot.cell(
			data,
			Plot.group(
				{fill: "count"}, 
				{ 
					x: "doc_month_lab", // (d) => d.doc_date.getUTCMonth(), 
				// with doc_month_lab you have to tell plot the right order
				// it might be better to use date data but
				// getUTCMonth() = numbers 0-11 - perhaps it can be told to use labels?	
				
				  y:"p5", // don't use tickFormat with decades or p5. 
				  inset: 0.5,  // inset adds white line between boxes,
				  tip: {
				  	format: {x: false, y: false}
				  }
				}
			) // /group
		) // /cell
	] // /marks


	})
}
```


```js
//To place an input inside a card, first declare a detached input as a top-level variable and use Generators.input to expose its reactive value:
// put the *Input* in the card 
// and the generators.input goes in filtering stuff

/*
// this goes in the card  ${genderVerdictFormInput}
const genderVerdictFormInput = 	Inputs.form({
  gender: Inputs.checkbox(valGender, {label: "gender", value: valGender }),
	verdict: Inputs.select(
				["All"].concat(valVerdict), // sort here if you need to
				{label: "verdict", unique: true,}
				)
  }); 
  
// this goes in filtering [genderVerdictForm was view(Inputs.form())]
const genderVerdictForm = Generators.input(genderVerdictFormInput); 

*/
```

```js
// make filtering data array for table/plot
// need thing["name"] in each line of the filter

const filterGenderVerdictForm =
	inquests
  	.filter((d) => 
  			genderVerdictForm["gender"].includes(d.gender) 	
  			&& 
  			( genderVerdictForm["verdict"] === "All" ||  d.verdict === genderVerdictForm["verdict"] )
  	)
  	.map((d) => ({...d}) ) // idk if actually need this

// count inquests per parish
const inquestsParishGenderVerdict =
d3.flatRollup(filterGenderVerdictForm, v => v.length, d => d.parish)
	.map((n) => ({parish: n[0], n: n[1]}))
	
	
const parish_gender_verdicts_index = d3.index(inquestsParishGenderVerdict, d => d.parish)


// join parish counts and  burials-totals instead of pop
// https://observablehq.com/@d3/d3-group
// (i don't fully understand how it works... )
// then calculate the rate. (this is when NaNs appear) 

const parishInquestsBurialsGenVerProp =
	burials_totals
		.map(({parish: parish, burials}) => ({burials, parish, ...parish_gender_verdicts_index.get(parish)}))
		.map((d) => ({parish: d.parish, inquests: d.n, burials: d.burials, prop: d.n / d.burials * 100}))
		


// turn the prop array into a Map. this goes into the plot:
// 	fill: (d) => parishInquestsBurialsGenVerMap.get(d.properties.parish)

const parishInquestsBurialsGenVerMap =
	new Map(parishInquestsBurialsGenVerProp.map((d) => [d.parish, d.prop]))	
	
// for tips, same principle.

// overall count of burials
const parishInquestsBurialsGenVerNBMap =
	new Map(parishInquestsBurialsGenVerProp.map((d) => [d.parish, d.burials]))
	
// filtered count of inquests
const parishInquestsBurialsGenVerNIMap =
	new Map(parishInquestsBurialsGenVerProp.map((d) => [d.parish, d.inquests]))

```

```js
//load inquests 

const inquests = FileAttachment("data/l_inquests/inquests.csv").csv({typed:true})

const parishes_geojson = FileAttachment("./data/westmr_parishes.geojson").json();

const burials_totals = FileAttachment("./data/l_inquests/burials-totals.csv").csv({typed: true});
```

```js
const inquests_count = inquests.length;
const burials_sum = d3.sum(burials_totals, (d) => d.burials);
const inquests_burials_pct = inquests_count / burials_sum;
```

```js
// for multi inputs for verdict/gender etc

// make array of distinct values using new Set
const valGender = [
  ...new Set(
    inquests  // data source
      .flatMap((n) => n.gender )
      .sort()
  )
] ;

const valVerdict = [
	...new Set(
		inquests 
			.flatMap((n) => n.verdict )
			.sort()
	)
] ;

```
```js
//filterGenderVerdictForm
```
```js
// table function 

function inquestsTable(data) {
 return Inputs.table(data, {
	layout: "fixed",
	sort: "doc_date",
	format: {
		doc_date: formatDate ,
		//url: url => htl.html`<a href=${url} target=_blank>link</a>`,
		// no idea how this works...
		// https://observablehq.com/d/1562bdd9c67de3e7
		the_deceased: (d, i, data) => htl.html`<a href=${data[i].url} target=_blank>${d}</a>`
	},
  columns: [
    //"id",
    "the_deceased",
    "doc_date",
    "gender",
    "verdict",
    "parish",
    "cause_of_death",
   // "deceased_additional_info"
  ], 
  header:  {
    //id: "Id",
    the_deceased: "name",
    doc_date: "date",
    gender: "gender",
    verdict: "verdict",
    parish: "parish",
    "cause_of_death": "cause of death",
   // "deceased_additional_info": "additional"
  },
})
}
```

```js
// format dates nicely
// to get rid of leading 0s in days use %e instead of %d.

const formatDate = d3.utcFormat("%e %b %Y");
```