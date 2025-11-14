---
theme: dashboard
title: Cheshire Petitions
toc: false
style: ./custom-styles.css
---


# Cheshire Quarter Sessions petitions, 1573-1798




<div class="grid grid-cols-2"  style="grid-auto-rows: auto;">
  <div class="card  grid-rowspan-2">
  	${datesPetitions()}
  </div>
  <div class="card">
  <h2>Filter by...</h2>
  	${checkBoxFormInput}
  </div>
  <div class="card">
  	${respPetitions()}
  </div>
</div>
<div class="grid grid-cols-2">
  <div class="card">
  	${wafflePetitions()}
  </div>
  <div class="card">
  	${topicsPetitions()}
  </div>
</div>


<div class="grid grid-cols-1" style="padding: 0;">
	<div class="card">
	${petitionsTable(filterCheckBoxForm)}
	</div>
</div>




<div class="grid grid-cols-2">
<div class="card">
<h2>About the data</h2>

Data for 613 petitions addressed to Cheshire magistrates between 1573 and 1798. Data was collected from one year in ten for the 17th and 18th centuries and all surviving petitions before 1600. 

</div>

<div class="card">
<h2>Resources</h2>

See [the introduction to the  edition](https://www.british-history.ac.uk/petitions/cheshire) for more details and [The Power of Petitioning Data](https://zenodo.org/records/7027693) for the full dataset.
</div>
</div>










```js
//To place an input inside a card, first declare a detached input as a top-level variable and use Generators.input to expose its reactive value:
// put the *Input* in the card 
// and the generators.input goes in filtering stuff

// this in the card  ${checkBoxFormInput}

const checkBoxFormInput = 	 
	Inputs.form({
  	gender: Inputs.checkbox(valGender, {label: "gender", value: valGender }),
  	topic: Inputs.checkbox(valTopic, {label: "topic", value: valTopic}),
  	response: Inputs.checkbox(valResp, {label: "response", value: valResp})
  } ,
  {
    template: (inputs) => htl.html`<div class="styled">
    <style>
  
  div.styled form>label { font-weight: bold; text-align: right;}
	div.styled form {padding: 4px 0;}
</style>
  ${Object.values(inputs)}
</div>`
  }
);

  
// this goes in filtering [checkBoxForm was view(Inputs.form())]
const checkBoxForm = Generators.input(checkBoxFormInput); 


```


```js
// view() version (would need styling)

/*const checkBoxForm = view(Inputs.form({
	// name: each input	(this is internal, not a label)
  gender: Inputs.checkbox(valGender, {label: "gender", value: valGender }),
  topic: Inputs.checkbox(valTopic, {label: "topic", value: valTopic}),
  response: Inputs.checkbox(valResp, {label: "response", value: valResp})
  }
  )
);*/
```



```js
function datesPetitions() {
return Plot.plot({
	title: "Change",
   y: {grid: true, label: "petitions"},
   x: {grid:true, label: "year"}, //, tickFormat: formatNum('d')
   // sort out x formatting
   marks: [
     Plot.barY(filterCheckBoxForm, 
                 Plot.groupX({y: "count"}, {x: "date"}  )
               ),
     Plot.ruleY([0])
   ]
 })
}
```


```js
function topicsPetitions() {
return Plot.plot({
  marginLeft: 100, 
  height: 300,
  title: "Topics",
  x: {grid: true, label: "petitions"},
  y: {grid:true, label: null},
  color: topicColours,
  marks: [
    Plot.barX(filterCheckBoxForm, 
                Plot.groupY({x: "count"}, 
                            {y: "topic", 
                              fill: "topic", 
                              tip: true,
                              sort: {y: "x", reverse: true}
                            })
              ),
    Plot.ruleX([0])
  ]
})
}
```


```js
function respPetitions() {
return Plot.plot({
  //height: 60, //  ojs issue... not needed here
  title: "Responses",
  x: {label: "petitions"},
  color: { legend: true },
  marks: [Plot.barX(filterCheckBoxForm, Plot.groupZ({ x: "count" }, { fill: "response", tip: true }))]
})
}
```


```js
function wafflePetitions() {
return Plot.plot({
	title: "Gender",
	height: 300,
  x: {label: "gender"},
  y: {label: "petitions"},
  //color: {topicColours, legend: true},
  marks: [
    Plot.waffleY(filterCheckBoxForm, 
      Plot.groupX({y: "count"}, {x: "petition_gender"})
      /*Plot.groupZ({y: "count"},
        {fill: "topic", sort: "topic", fx: "petition_gender"} )*/
    )
  ]
})
}
```

```js

// make array of distinct values using new Set
const valGender = [
  ...new Set(
    cheshire_petitions  // data source
      .flatMap((n) => n.petition_gender )
      .sort()
  )
] ;

const valTopic = [
	...new Set(
		cheshire_petitions 
			.flatMap((n) => n.topic )
			.sort()
	)
] ;

const valResp = [
	...new Set(
		cheshire_petitions 
			.flatMap((n) => n.response )
			.sort()
	)
];
```

```js
// make filtering data array for table
// need ["name"] in each line of the filter

const filterCheckBoxForm =
	cheshire_petitions
  	.filter((d) =>
  			checkBoxForm["gender"].includes(d.petition_gender) &&
  			checkBoxForm["topic"].includes(d.topic) &&
  			checkBoxForm["response"].includes(d.response)
  	)
  	.map((d) => ({...d}) )
```





```js
const petitions = FileAttachment("./data/l_cheshire_petitions/cheshire-petitions.csv").csv({typed: true});
```

```js
// don't try to put this in the same chunk as petitions
// you won't believe what happens to .columns

const cheshire_petitions =
	petitions.map((d) => ({...d, date: formatNum(d.date2)}))
```


```js
// need to use petitions, not cheshire_petitions

const petColumns = petitions.columns.slice(0,7);
const petHeader = petColumns.map((d) => d.replace("petition_", "") );

// make key:value pairs for header: in table.
const columnsHeaders = 
	Object.fromEntries(
		petColumns.map((key, index) => [key, petHeader[index]])
	)
```


```js
function petitionsTable(data) {
 return Inputs.table(data, {
	layout: "fixed",
	sort: "year",
	format: {
		year: d3.format(".0f") , 
	},
  columns: petColumns, 
  header: columnsHeaders
})
}
```




```js
// hack stupid date problem
// date2 column ends up mixed number/strings. Plot fuxxes this up.
function formatNum(x) {
  if( Number.isInteger(x)) { 
    return d3.format(".0f")(x) // If this statement is true return this
  } else { 
    return x  // If the first statement was false, return this
  }
}
```





```js
const topicColours = Plot.scale({
        color: {
            range: ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#ff7f00", "#fdbf6f", "#e31a1c", "#fb9a99", "#ffed6f", "#8c510a",  "#cab2d6",  "#6a3d9a",  "#80cdc1"], 
            domain: ["alehouse", "charitable brief", "cottage", "dissenting worship", "employment", "imprisoned debtors", "litigation", "military relief", "officeholding", "other",  "paternity", "poor relief", "rates"]
        }
    });
```

